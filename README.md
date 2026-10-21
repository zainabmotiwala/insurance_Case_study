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

## Refreshing Data

When new monthly VAHAN files arrive, drop them into `data\raw\` (filename must
contain `FuelType`), then re-run `rebuild_registrations.py` and
`test_registration_data.py`. October 2026 is excluded from the analytical
dataset until the complete month is published.
