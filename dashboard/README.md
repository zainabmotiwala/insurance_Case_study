# Maharashtra Motor Insurance Intelligence Platform
## Dashboard — Run & Operate Guide

---

## Quick Start

```powershell
# From the repository root:
cd dashboard
npm install       # already done — skip if node_modules exists
npm run dev       # starts dev server, usually http://localhost:5173
```

Open the URL shown in the terminal (e.g. `http://localhost:5177/`) in any modern browser.

---

## Project Structure

```
ATSA/
├── dashboard/                     ← React/TypeScript Vite app (Phase 6)
│   ├── public/
│   │   ├── registrations_mh_monthly.json   ← MH-ALL monthly pivot (117 months)
│   │   ├── gdpi_maharashtra.json            ← IRDAI GDPI FY 2014-25
│   │   ├── rolling_origin.json              ← 33 walk-forward actuals vs models
│   │   ├── forecast_metrics.json            ← Benchmark metrics (authoritative CSV)
│   │   ├── timeseries_diagnostics.json      ← Decomposition + YoY + Z-scores
│   │   ├── rto_monthly.json                 ← 7 RTO office monthly totals
│   │   ├── rto_annual.json                  ← RTO annual EV/E20/totals
│   │   └── gdpi_segment_wise.json           ← Insurer-level YTD snapshots
│   └── src/
│       ├── App.tsx                ← Top bar, filter bar, nav tabs
│       ├── hooks.ts               ← Data fetching + format helpers
│       ├── types.ts               ← TypeScript interfaces + RTO names
│       ├── index.css              ← Full design system (Monex-inspired dark)
│       └── tabs/
│           ├── SummaryTab.tsx     ← Tab 1: KPIs, fuel mix, E20/EV trends
│           ├── BalanceTab.tsx     ← Tab 2: Powertrain trends, RTO breakdown
│           ├── SpendingTab.tsx    ← Tab 3: Actuarial scenario engine
│           ├── IncomeTab.tsx      ← Tab 4: GDPI + forecast model comparison
│           └── GTMTab.tsx         ← Tab 5: GTM scenario engine, RTO priority
├── data/clean/                    ← Source CSV files
├── reports/                       ← Forecast metrics, audit reports, charts
└── scripts/                       ← Python pipeline scripts
```

---

## Dashboard Sections

| Tab | Content |
|-----|---------|
| **① Summary** | 5 KPI cards, annual stacked bar by powertrain, monthly trend, E20/EV adoption line chart, Sep 2026 fuel mix donut, seasonal factor bar |
| **② Balance & Registrations** | Monthly powertrain area chart, YoY growth bar, RTO annual stacked bars, RTO 2025 performance table; switches to RTO monthly area when non-statewide geography selected |
| **③ Spending & Actuarial** | Observed Motor OD/TP GDPI, frequency×severity loss-ratio grid, interactive slider scenario engine (OD frequency, severity, expense ratio, TP LR, fleet, penetration) |
| **④ Income & Forecasting** | Motor OD/TP GDPI historical line, rolling-origin actual vs SARIMA vs SNaive, absolute error bar chart, model benchmark table from `forecast_metrics_summary.csv` |
| **⑤ Net Income & GTM** | EV registration ComposedChart, RTO priority matrix, GTM revenue scenario sliders (retention, uninsured gap, EV uplift, add-on penetration), E20 Protect concept cards |

---

## Filters

| Filter | Effect |
|--------|--------|
| **Geography** | `MH-ALL` = statewide (all tabs fully active). Any RTO = Balance tab shows that RTO's monthly trend; other tabs stay statewide or show a notice |
| **From/To Year** | Slices registration chart date ranges. Defaults to full 2017–Sep 2026 |

---

## Data Integrity Rules Enforced

- **Oct 2026 excluded** — `month_id >= 202610` never loaded into public JSONs
- **RTO ≠ MH-ALL** — `rto_monthly.json` and `rto_annual.json` come from `geo_level == 'rto'` rows only; never summed with MH-ALL
- **2026 YTD labelled** — All 2026 figures carry "(9M)" or "YTD" labels
- **E20 ≠ fuel consumed** — Caveat boxes appear on every chart involving E20 shares
- **GDPI annual only** — No monthly division attempted; monthly insurer data labelled YTD
- **Scenarios clearly tagged** — `<span class="scenario-tag">` and `<span class="assumption-tag">` on all hypothetical outputs
- **RMSE superseded** — Audit erratum is documented in tab 4; MAE/WAPE from CSV are authoritative

---

## Known Limitations (from project audit)

1. **No vehicle-class data** — 2W vs 4W cannot be separated; EV exposure is overwhelmingly 2W/3W but not quantifiable
2. **Insurance claims/LR not available** — All combined ratio and loss ratio figures in Tab 3 are illustrative scenarios
3. **GDPI monthly unavailable** — IRDAI Table 42 is annual; insurer segment-wise YTD not comparable to full-year figures
4. **E20 label ≠ E20 fuel** — VAHAN tags engine compliance, not OMC pump blend
5. **RTO coverage gaps** — MH-AURANGABAD data ends 2023 in this dataset; MH-THANE/VASHI start 2019
6. **Forecasting models run on registrations only** — No econometric link to GDPI exists in this dataset

---

## Commands

```powershell
npm run dev      # Development server with HMR
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
```

Build output: `dashboard/dist/` (deployable static files).
