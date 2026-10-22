# ATSA — Maharashtra Motor Vehicle Registrations & Insurance Analytics

Analysis of VAHAN vehicle registrations in Maharashtra (2017–2026): powertrain
substitution (Petrol → E20 → EV), forecasting benchmarks, and insurance/fuel-price
context. See `PROGRESS.md` (status) and `PLAN.md` (next steps).

## Project Structure

```
ATSA/
├── ATSA Project.xlsx        Project workbook (kept at root)
├── PROGRESS.md              Status & findings to date
├── PLAN.md                  Roadmap for remaining phases
├── README.md                This file
│
├── scripts/                 All code
│   ├── rebuild_registrations.py        Raw VAHAN xlsx → cleaned CSVs
│   ├── test_registration_data.py       10 data-integrity unit tests
│   ├── exploratory_market_analysis.py  EDA + stationarity + decomposition
│   ├── forecast_comparison.py          SARIMA / Holt-Winters / GBM benchmark
│   ├── market_eda.ipynb                EDA notebook
│   └── forecast_comparison.ipynb       Benchmark results notebook
│
├── data/
│   ├── raw/                 Downloaded source files (VAHAN, IRDAI, PPAC)
│   │   └── Publication of Handbook 2024-25 on IRDAI Website/   Extracted handbook
│   └── clean/               Cleaned analytical CSVs (output of rebuild)
│
├── reports/                 Generated reports, docs, metrics & charts
│   ├── FORECAST_AND_FINDINGS_REPORT.md
│   ├── EXPLORATORY_MARKET_ANALYSIS.txt
│   ├── DATA_QUALITY_REPORT.txt
│   ├── DATA_DICTIONARY_AND_MAPPING.md
│   ├── renaming_mapping.txt
│   └── *.png, *_metrics_summary.csv, ...
│
└── original data/           Source PDFs (flash reports, newsletters, price history)
```

## Running the Pipeline

The Python scripts anchor all paths to the project root (`DATA_FOLDER` constant),
so they can be run from any working directory:

```
python scripts\rebuild_registrations.py      # raw xlsx -> data\clean\*.csv
python scripts\test_registration_data.py     # 10/10 integrity tests
python scripts\exploratory_market_analysis.py
python scripts\forecast_comparison.py
```

Notebooks use project-root-relative paths (`data/clean/...`, `reports/...`) —
launch Jupyter with `Documents\ATSA` as the working directory.

## Ask-the-Forecast (interactive SARIMA queries)

The dashboard's **④ Income & Forecasting** tab has a question box, for example
*"What would demand for diesel vehicles look like in Aug 2028?"*. It is backed by
`scripts/forecast_service.py`, which refits the benchmark SARIMA specification
(same orders and COVID exog as `forecast_comparison.py`) on all observed months
and forecasts forward to the requested month, with 80%/95% intervals.

- Vehicle types: diesel, petrol (incl. E20), electric/EV, CNG, total
- Dates: "Aug 2028", "2028-08", "08/2028", "aug '28"; a year alone returns the Jan–Dec total
- Maximum horizon: 120 months past the last observed month

```
python3 -m venv .venv && .venv/bin/pip install -r requirements-forecast.txt
.venv/bin/python scripts/forecast_service.py          # API on http://127.0.0.1:8765
cd dashboard && npm install && npm run dev            # Vite proxies /api to the service
```

CLI one-off: `.venv/bin/python scripts/forecast_service.py "diesel vehicles in August 2028"`

## Refreshing Data

When new monthly VAHAN files arrive, drop them into `data\raw\` (filename must
contain `FuelType`), then re-run `rebuild_registrations.py` and
`test_registration_data.py`. October 2026 is excluded from the analytical
dataset until the complete month is published.
