# ATSA Project — Progress File

**Project:** Maharashtra Motor Vehicle Registrations & Insurance Analytics (ATSA)
**Last updated:** 2026-10-20
**Data coverage:** VAHAN registrations 2017-01 → 2026-09 (Oct 2026 partial, excluded)

---

## 1. Project Objective

Analyze Maharashtra vehicle registration dynamics (VAHAN fuel-type data, 2017–2026),
study powertrain substitution (Petrol → E20 → EV), benchmark time-series forecasting
models, and connect registration trends with insurance (IRDAI GDPI) and fuel-price context.

---

## 2. Work Completed (by phase)

### Phase 1 — Data Acquisition & Inventory ✅ COMPLETE
- 163 source files collected (raw spreadsheets now in `data\raw\`, source PDFs in
  `original data\`):
  - VAHAN monthly fuel-type registrations: **statewide (MH-ALL)** 2017–2026
  - **RTO-level** files: MH-01 Mumbai Central, MH-04 Thane, MH-12 Pune,
    MH-14 Pimpri-Chinchwad, MH-15 Nashik, MH-20 Aurangabad, MH-43 Vashi
  - Annual fuel-type registrations 2017–2021, 2022–2026
  - All-India 2W vehicle-category/fuel-type annual 2026
  - IRDAI: GDPI state-wise + segment-wise insurer reports; ATSA Project.xlsx
  - Fuel prices: PPAC fortnightly petroleum prices, retail price snapshot, Pune GA history
  - Rajya Sabha / GIC yearbook PDFs and newsletters (original data\)
- File inventory: `FILE_INVENTORY.csv` (151 files indexed)

### Phase 2 — Data Cleaning & Validation ✅ COMPLETE
- Master long-format dataset built by `rebuild_registrations.py`
  (`renaming_mapping.txt` documents the fuel-label harmonization):
  - `registrations_clean.csv` — 7,534 rows (month, location, fuel_group, count)
  - `registrations_analytical.csv` — 7,992 rows
  - `registrations_maharashtra_monthly.csv` — 1,540 rows statewide
- Side datasets cleaned: `gdpi_clean.csv` (4,829), `gdpi_maharashtra.csv` (132),
  `gdpi_segment_wise.csv` (352), `fuel_prices_clean.csv` (223), `retail_prices_clean.csv` (38)
- **Unit tests: 10/10 PASS** (`test_registration_data.py`)
- Data-quality report: `DATA_QUALITY_REPORT.txt`
- Documentation: `DATA_DICTIONARY_AND_MAPPING.md`

### Phase 3 — Exploratory Market Analysis ✅ COMPLETE
- `market_eda.ipynb` + `exploratory_market_analysis.py` → `EXPLORATORY_MARKET_ANALYSIS.txt`
- Key findings:
  - 117 complete months; mean ≈ 213.6k registrations/month; record 448,934 (Oct 2025)
  - Annual volumes: 2.56M (2017) → trough 1.77M (2020) → record 3.29M (2025); 2026 9M +21.4% YoY
  - Fuel-share shift (2017-18 vs 2023-26): Petrol-standard 80.8% → 54.0%;
    Petrol-E20 0% → 15.2%; EV 0.1% → 8.7%
  - **E20 penetration within pure petrol: 0.29% (Q1-2023) → 71.2% (Q3-2026)**
  - Stationarity: Total/Petrol/Diesel are I(1); EV series needs log/2nd-difference
  - COVID structural break (Mar–May 2020, May 2021) documented

### Phase 4 — Forecast Benchmarking ✅ COMPLETE (audited 2026-10-21)
- `forecast_comparison.py` / `.ipynb` → `FORECAST_AND_FINDINGS_REPORT.md`
- **Reproducibility audit passed 2026-10-21** (`reports/FORECAST_AUDIT_REPORT.md`): full
  re-run reproduced all MAE/WAPE/rolling-origin/Ljung-Box figures exactly; the report's
  RMSE columns were found inaccurate and superseded by `forecast_metrics_summary.csv`.
  Findings and model rankings unaffected.
- Split: Train 2017–2023 | Validation 2024–2025 | Test 2026-01→09; 33 rolling origins
- **Champion: SARIMA(1,1,1)(1,1,0)₁₂ + COVID exogenous pulses** on Total
  (Overall WAPE 9.05%, Test WAPE 6.73%; beats seasonal-naive by 32.7% walk-forward)
- Model-per-series conclusions:
  - Total & Petrol: SARIMA + COVID exog
  - Diesel: seasonal-naive best (stable steady-state)
  - Electric: lagged gradient boosting best (non-linear EV ramp)
- Residuals: Ljung-Box clean at lags 6 & 12 (white noise); Q-Q acceptable
- 4 charts exported at 150 DPI; metrics in `forecast_metrics_summary.csv` and
  `rolling_origin_metrics.csv`

---

## 3. Current State

- **End-to-end pipeline works**: raw VAHAN files → clean CSVs → validated → EDA →
  benchmarked forecasts → report.
- **Reusable codebase**: rebuild script + tests + mapping dictionary make the data
  refresh reproducible when new monthly VAHAN files arrive.
- **Reorganized 2026-10-21** into `scripts\`, `data\raw\`, `data\clean\`, `reports\`
  (see `README.md`); all script and notebook paths updated and test suite re-verified.
- Project has *not yet* been pushed to git; no dashboard or packaged report exists.

## 4. Known Open Issues (from report §6)

1. **No vehicle-class segmentation** — 2W/3W/4W pooled in fuel files; fuel-share
   dynamics can't be attributed to buyer segments (partially mitigated by the
   All-India category-group file, which is annual & national only).
2. **E20 label ≠ E20 consumption** — VAHAN tags engine certification, not fuel dispensed.
3. **Insurance only annual** (IRDAI FY, ends 2024-25) — no monthly insurance series
   for econometric modeling.
4. **COVID breaks require permanent exogenous conditioning** in any refit.
5. **Oct 2026 partial** (mid-month extract, ~46%) — excluded from benchmarks.
