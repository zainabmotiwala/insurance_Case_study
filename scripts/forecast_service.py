"""
ATSA: On-demand SARIMA Forecast Service for Maharashtra Vehicle Registrations

Answers questions such as "What would demand for diesel vehicles look like in
Aug 2028?" by refitting the benchmark SARIMA specification from
forecast_comparison.py on the FULL observed window (2017-01 .. last complete
month) and forecasting forward to the requested month.

Model specification (identical to forecast_comparison.py):
- SARIMA(1,1,1)(1,1,0)12 with COVID-19 pulse exog (2020-03..05, 2021-04..05)
- Electric uses the stable SARIMA(0,1,1)(0,1,1)12 variant
- Future exog = 0 (no lockdowns assumed)
- Intervals: 80% (as in the benchmark) and 95%

Usage:
    python scripts/forecast_service.py                 # HTTP API on :8765
    python scripts/forecast_service.py "diesel aug 2028"   # one-off CLI answer

HTTP API (used by the dashboard via the Vite /api proxy):
    GET /api/forecast?q=diesel+vehicles+in+august+2028
    GET /api/forecast?series=Diesel&year=2028&month=8
    GET /api/series
"""

import json
import os
import re
import sys
import threading
import warnings
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

import numpy as np
import pandas as pd
from statsmodels.tsa.statespace.sarimax import SARIMAX

warnings.filterwarnings("ignore")

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(PROJECT_ROOT, "data", "clean", "registrations_maharashtra_monthly.csv")

PORT = int(os.environ.get("FORECAST_PORT", "8765"))
MAX_HORIZON_MONTHS = 120   # refuse forecasts more than 10 years past the data
LONG_HORIZON_MONTHS = 24   # beyond this the answer carries an extrapolation warning
HISTORY_MONTHS = 36        # months of actuals returned for charting

# Series definitions: fuel groups summed per series, mirroring forecast_comparison.py
SERIES = {
    "Total": {"label": "All vehicles (statewide total)", "fuel_groups": None},
    "Petrol_Combined": {"label": "Petrol vehicles (Petrol + Petrol-E20)", "fuel_groups": ["Petrol", "Petrol-E20"]},
    "Diesel": {"label": "Diesel vehicles", "fuel_groups": ["Diesel"]},
    "Electric": {"label": "Electric vehicles (Pure EV + Electric-BOV)", "fuel_groups": ["Pure EV", "Electric-BOV"]},
    "CNG": {"label": "CNG vehicles (CNG + Petrol-CNG + Petrol-E20-CNG)", "fuel_groups": ["CNG", "Petrol-CNG", "Petrol-E20-CNG"]},
}

# Keyword -> series, checked in order (CNG before petrol so "petrol cng" maps to CNG)
SERIES_KEYWORDS = [
    ("CNG", r"\bcng\b|compressed natural gas"),
    ("Electric", r"\belectric\b|\bevs?\b|\bbov\b|battery"),
    ("Diesel", r"\bdiesel\b"),
    ("Petrol_Combined", r"\bpetrol\b|\bgasoline\b|\be20\b"),
    ("Total", r"\btotal\b|\ball\b|\boverall\b|\bstatewide\b"),
]

MONTHS = ["january", "february", "march", "april", "may", "june", "july",
          "august", "september", "october", "november", "december"]
MONTH_ABBR = {m[:3]: i + 1 for i, m in enumerate(MONTHS)}
MONTH_ABBR["sept"] = 9


# -----------------------------------------------------------------------------
# 1. Data & Model
# -----------------------------------------------------------------------------
def load_series():
    df = pd.read_csv(DATA_PATH, dtype={"month_id": str})
    df["date"] = pd.to_datetime(df["date"])
    total = df.groupby("date")["count"].sum().sort_index()
    series = {}
    for name, spec in SERIES.items():
        if spec["fuel_groups"] is None:
            series[name] = total
        else:
            sub = df[df["fuel_group"].isin(spec["fuel_groups"])]
            series[name] = sub.groupby("date")["count"].sum().reindex(total.index, fill_value=0)
    return series


def covid_exog(index):
    exog = pd.DataFrame(index=index)
    exog["covid_2020"] = ((index >= "2020-03-01") & (index <= "2020-05-01")).astype(int)
    exog["covid_2021"] = ((index >= "2021-04-01") & (index <= "2021-05-01")).astype(int)
    return exog


def sarima_orders(s_name):
    if s_name == "Electric":
        # EV series has near-zero early history; stable (0,1,1)(0,1,1,12)
        return (0, 1, 1), (0, 1, 1, 12)
    return (1, 1, 1), (1, 1, 0, 12)


class ForecastEngine:
    """Holds the observed series and lazily fits one full-window SARIMA per series."""

    def __init__(self):
        self.series = load_series()
        self.last_date = self.series["Total"].index.max()
        self._models = {}
        self._lock = threading.Lock()

    def model(self, s_name):
        with self._lock:
            if s_name not in self._models:
                y = self.series[s_name]
                order, s_order = sarima_orders(s_name)
                self._models[s_name] = SARIMAX(
                    y,
                    order=order,
                    seasonal_order=s_order,
                    exog=covid_exog(y.index),
                    enforce_stationarity=False,
                    enforce_invertibility=False,
                ).fit(disp=False)
            return self._models[s_name]

    def warm(self):
        for s_name in SERIES:
            self.model(s_name)

    def forecast_path(self, s_name, steps):
        future_idx = pd.date_range(self.last_date + pd.offsets.MonthBegin(1), periods=steps, freq="MS")
        res = self.model(s_name).get_forecast(steps=steps, exog=covid_exog(future_idx))
        mean = res.predicted_mean.values
        ci80 = res.conf_int(alpha=0.20).values
        ci95 = res.conf_int(alpha=0.05).values
        # Registrations cannot be negative
        clip = lambda a: np.clip(a, 0, None)
        return pd.DataFrame({
            "date": future_idx,
            "forecast": clip(mean),
            "lower80": clip(ci80[:, 0]), "upper80": clip(ci80[:, 1]),
            "lower95": clip(ci95[:, 0]), "upper95": clip(ci95[:, 1]),
        })

    def answer(self, s_name, year, month=None):
        """Forecast one month (or a whole calendar year when month is None)."""
        if s_name not in SERIES:
            raise ValueError(f"Unknown series '{s_name}'. Choose from: {', '.join(SERIES)}")
        y = self.series[s_name]
        last = self.last_date
        end_month = month or 12
        target = pd.Timestamp(year=year, month=end_month, day=1)
        steps = (target.year - last.year) * 12 + (target.month - last.month)
        if steps > MAX_HORIZON_MONTHS:
            raise ValueError(
                f"{target.strftime('%b %Y')} is {steps} months past the last observed month "
                f"({last.strftime('%b %Y')}). Maximum supported horizon is {MAX_HORIZON_MONTHS} months."
            )

        path = self.forecast_path(s_name, steps) if steps > 0 else pd.DataFrame(
            columns=["date", "forecast", "lower80", "upper80", "lower95", "upper95"])

        def value_at(ts):
            """Observed value if available, else the forecast row."""
            if ts <= last:
                return {"observed": True, "value": float(y.loc[ts])}
            row = path[path["date"] == ts].iloc[0]
            return {
                "observed": False,
                "value": float(row["forecast"]),
                "lower80": float(row["lower80"]), "upper80": float(row["upper80"]),
                "lower95": float(row["lower95"]), "upper95": float(row["upper95"]),
            }

        if month is not None:
            result = value_at(target)
            prior_ts = target - pd.DateOffset(years=1)
            prior = value_at(prior_ts) if prior_ts >= y.index.min() else None
            period_label = target.strftime("%B %Y")
        else:
            months = pd.date_range(pd.Timestamp(year=year, month=1, day=1), periods=12, freq="MS")
            if months[0] < y.index.min():
                raise ValueError(f"No data before {y.index.min().strftime('%Y')}.")
            vals = [value_at(m) for m in months]
            result = {"observed": all(v["observed"] for v in vals), "value": sum(v["value"] for v in vals)}
            prior_months = months - pd.DateOffset(years=1)
            prior = None
            if prior_months[0] >= y.index.min():
                pv = [value_at(m) for m in prior_months]
                prior = {"observed": all(v["observed"] for v in pv), "value": sum(v["value"] for v in pv)}
            period_label = f"Calendar year {year} (Jan–Dec total)"

        yoy = None
        if prior and prior["value"] > 0:
            yoy = (result["value"] / prior["value"] - 1) * 100

        order, s_order = sarima_orders(s_name)
        history = y.loc[y.index > last - pd.DateOffset(months=HISTORY_MONTHS)]
        warnings_out = []
        if steps > LONG_HORIZON_MONTHS:
            warnings_out.append(
                f"Horizon is {steps} months ahead. SARIMA extrapolates past trend and seasonality only; "
                "it does not model policy changes (E20 mandate, EV subsidies) or fuel-price shocks, so "
                "treat this as a baseline scenario and read the interval rather than the point."
            )
        if s_name == "Diesel":
            warnings_out.append(
                "Benchmark caveat: on Diesel, SARIMA's out-of-sample WAPE was 27.1% vs 15.2% for "
                "Seasonal-Naive, so expect wider real-world error than the point estimate suggests."
            )
        if s_name == "Electric":
            warnings_out.append(
                "Benchmark caveat: on Electric, SARIMA (21.9% WAPE) was roughly tied with Gradient "
                "Boosting (21.5%); a linear SARIMA may miss S-curve acceleration or saturation."
            )

        return {
            "series": s_name,
            "series_label": SERIES[s_name]["label"],
            "period_label": period_label,
            "target_year": year,
            "target_month": month,
            "horizon_months": max(steps, 0),
            "last_observed": last.strftime("%Y-%m"),
            "model": f"SARIMA{order}{s_order[:3]}{s_order[3]} + COVID exog (refit 2017-01..{last.strftime('%Y-%m')})",
            "result": result,
            "prior_year": prior,
            "yoy_pct": yoy,
            "warnings": warnings_out,
            "history": [{"date": d.strftime("%Y-%m"), "actual": float(v)} for d, v in history.items()],
            "path": [
                {
                    "date": r.date.strftime("%Y-%m"),
                    "forecast": float(r.forecast),
                    "lower80": float(r.lower80), "upper80": float(r.upper80),
                    "lower95": float(r.lower95), "upper95": float(r.upper95),
                }
                for r in path.itertuples()
            ],
        }


# -----------------------------------------------------------------------------
# 2. Natural-language query parsing
# -----------------------------------------------------------------------------
def parse_query(text):
    """Extract (series, year, month) from a free-text question.

    Accepts e.g. "diesel vehicles in aug 2028", "EV demand 2027-03",
    "petrol 08/2028", "total registrations in 2029" (month=None -> annual).
    """
    q = text.lower()

    s_name = None
    for name, pattern in SERIES_KEYWORDS:
        if re.search(pattern, q):
            s_name = name
            break

    year = month = None
    m = re.search(r"\b(20\d{2})[-/.](\d{1,2})\b", q)          # 2028-08
    if m:
        year, month = int(m.group(1)), int(m.group(2))
    if year is None:
        m = re.search(r"\b(\d{1,2})[-/.](20\d{2})\b", q)      # 08/2028
        if m:
            month, year = int(m.group(1)), int(m.group(2))
    if year is None:
        m = re.search(r"\b(20\d{2})\b", q)
        if m:
            year = int(m.group(1))
    if month is None:
        m = re.search(r"\b(" + "|".join(sorted(MONTH_ABBR, key=len, reverse=True)) + r")[a-z]*\.?\b", q)
        if m:
            month = MONTH_ABBR[m.group(1)]
    if year is None and month is not None:
        # Two-digit year after a month name: "aug '28", "aug 28"
        m = re.search(r"\b(?:" + "|".join(MONTH_ABBR) + r")[a-z]*\.?\s*'?(\d{2})\b", q)
        if m:
            year = 2000 + int(m.group(1))

    if month is not None and not 1 <= month <= 12:
        raise ValueError(f"Month {month} is not valid.")
    if year is None:
        raise ValueError("Couldn't find a target year. Try e.g. 'diesel vehicles in August 2028'.")
    return s_name, year, month


# -----------------------------------------------------------------------------
# 3. HTTP API
# -----------------------------------------------------------------------------
ENGINE = None


class Handler(BaseHTTPRequestHandler):
    def _send(self, status, payload):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        url = urlparse(self.path)
        params = {k: v[0] for k, v in parse_qs(url.query).items()}
        try:
            if url.path == "/api/series":
                self._send(200, {
                    "series": [{"id": k, "label": v["label"]} for k, v in SERIES.items()],
                    "last_observed": ENGINE.last_date.strftime("%Y-%m"),
                    "max_horizon_months": MAX_HORIZON_MONTHS,
                })
            elif url.path == "/api/forecast":
                s_name, year, month = None, None, None
                if params.get("q"):
                    s_name, year, month = parse_query(params["q"])
                s_name = params.get("series") or s_name or "Total"
                year = int(params["year"]) if params.get("year") else year
                month = int(params["month"]) if params.get("month") else month
                if year is None:
                    raise ValueError("Provide a question (q) or a year.")
                self._send(200, ENGINE.answer(s_name, year, month))
            else:
                self._send(404, {"error": "Not found"})
        except ValueError as e:
            self._send(400, {"error": str(e)})
        except Exception as e:  # surface model failures to the UI rather than hanging
            self._send(500, {"error": f"Forecast failed: {e}"})

    def log_message(self, fmt, *args):
        sys.stderr.write("[forecast] " + fmt % args + "\n")


def main():
    global ENGINE
    ENGINE = ForecastEngine()

    if len(sys.argv) > 1:
        s_name, year, month = parse_query(" ".join(sys.argv[1:]))
        print(json.dumps(ENGINE.answer(s_name or "Total", year, month), indent=2))
        return

    print(f"Fitting SARIMA models on 2017-01..{ENGINE.last_date.strftime('%Y-%m')} ...")
    ENGINE.warm()
    print(f"Forecast API listening on http://127.0.0.1:{PORT}  (GET /api/forecast?q=...)")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()


if __name__ == "__main__":
    main()
