# Forecasting Stage — Audit Report

**Project:** Maharashtra Motor Insurance Intelligence Platform (ATSA)
**Scope:** Reproducibility and methodology audit of the forecasting comparison stage (SRS Phase 3 / FR-06)
**Audited:** 2026-10-21 | **Benchmark source:** `scripts/forecast_comparison.py` re-executed end-to-end on this date
**Reference documents:** `Combined_BRD_SRS_Maharashtra_Motor_Insurance_Intelligence.docx` (v1.0, Oct 2026) and the task brief of 2026-10-21

---

## 1. Verdict

The existing forecasting work is **valid, reusable, and reproducible — with one documentation defect**.
The benchmark was re-run from scratch against the cleaned data; every reported MAE, WAPE,
rolling-origin, and residual-diagnostic figure reproduced exactly. The RMSE columns in
`FORECAST_AND_FINDINGS_REPORT.md`, however, do **not** match the pipeline's actual output and
must be treated as superseded (see §3). No results were fabricated in the pipeline itself; the
error is confined to the report document.

---

## 2. Requirement-by-Requirement Status

| # | Requirement (task brief) | Status | Evidence |
|---|---|---|---|
| 1 | Audit existing work; reuse, don't restart | ✅ | This audit; all artifacts re-verified, none rebuilt from scratch |
| 2 | Four model families (S-Naive, HW, SARIMA, GBM) | ✅ | All four implemented per series (`scripts/forecast_comparison.py` §2) |
| 3 | MH-ALL, monthly only, complete months through 2026-09; no double counting | ✅ | `rebuild_registrations.py` filters `data_type=='monthly'`, `location_id=='MH-ALL'`, excludes 202610; enforced by 10/10 unit tests |
| 4 | Chronological splits 2017–23 / 2024–25 / 2026 1–9; test out of selection; rolling-origin | ✅ (see §4.2 nuance) | Splits verified in code (84/24/9 months); 33-origin 1-step walk-forward executed |
| 5 | MAE, RMSE, diagnostics, plots, prediction intervals; series evaluated only where supported | ✅ (see §3 RMSE note) | Ljung-Box + Q-Q plots; SARIMA 80% CI bands; GBM quantile (10/90) intervals; EV gets its own SARIMA specification due to short history |
| 6 | COVID sensitivity; E20/EV label-change sensitivity; no E20-consumption inference | ✅ | COVID pulse regressors (2020 lockdown, 2021 wave) + demonstrated HW degradation; `PETROL(E20)` preserved as distinct label; label ≠ consumption caveat documented in EDA §4 and report §6 |
| 7 | Reproducible scripts, tables, charts, configuration, report in named folders | ✅ (minor gap) | `scripts/`, `data/raw/`, `data/clean/`, `reports/`; hyperparameters fixed in code (seed 42, documented) — no separate config file (minor, §4.5) |

---

## 3. Reproducibility Results (re-executed 2026-10-21)

Re-run of `scripts/forecast_comparison.py` regenerated `forecast_metrics_summary.csv`,
`rolling_origin_metrics.csv`, and all four charts. Comparison against
`FORECAST_AND_FINDINGS_REPORT.md`:

**Reproduced exactly (all 16 series × model rows):**
- All MAE columns (Validation, Test, Overall) — e.g., Total SARIMA: Val 25,817.0 / Test 19,517.0 / Overall 24,098.8
- All WAPE columns — e.g., Total SARIMA: Val 10.03% / Test 6.73% / Overall 9.05%
- Rolling-origin walk-forward: S-Naive 37,092.3 (13.93%) vs SARIMA 24,948.4 (9.37%), 33 origins
- Ljung-Box: lag 6 → 3.9438 (p = 0.6843); lag 12 → 11.7728 (p = 0.4641)
- Split boundaries: 117 months (2017-01–2026-09), 84/24/9

**❌ NOT reproduced — RMSE columns of the report are wrong (all 16 rows):**
The report's RMSE values match neither the script's output nor the CSV. Examples:

| Series | Model | Report Val RMSE | Reproduced Val RMSE |
|---|---|---|---|
| Total | SARIMA | 31,778.6 | **41,189.2** |
| Total | S-Naive | 45,959.0 | **42,829.9** |
| Total | Grad-Boost | 55,618.3 | **62,719.2** |
| Electric | Grad-Boost (Test) | 9,505.7 | **9,687.2** |

**Disposition:** `reports/forecast_metrics_summary.csv` (regenerated) is the authoritative
metrics source. An erratum has been added to the report. Model rankings and all findings are
unaffected (they rest on MAE/WAPE, which reproduce exactly).

---

## 4. Methodological Findings & Caveats

### 4.1 Data-rule compliance (SRS §3.3) — PASS
Monthly-only series from `registrations_maharashtra_monthly.csv` (MH-ALL, `data_type=='monthly'`,
2026-10 excluded). Annual rows and RTO rows cannot contaminate totals by construction, verified
by the unit-test suite (10/10, re-run 2026-10-21 after the folder reorganization).

### 4.2 Model-selection protocol — sound, one nuance
Champion models are cited in the report using Overall (validation + test) metrics. Strict
protocol selects on validation only. Re-checking on validation alone yields the **same
champions** for all four series (Total: SARIMA 10.03%; Petrol: SARIMA 12.53%; Diesel:
S-Naive 17.38%; Electric: Grad-Boost 18.26%), so conclusions are robust — but note that on the
test window alone, Holt-Winters beat SARIMA on Total (4.53% vs 6.73%), illustrating why test
data must stay out of selection.

### 4.3 Known design limitations (documented, acceptable for current stage)
- Rolling-origin backtesting covers **Total only** and two models (S-Naive, SARIMA); the brief
  allows this ("if feasible"), but fuel/EV series lack walk-forward evidence.
- Ljung-Box runs on pooled validation+test multi-step residuals (two different refit origins),
  so "white noise" describes pooled errors rather than a single forecast horizon.
- COVID exog window in code is Apr–May 2021; the report narrative says "May 2021" — a
  cosmetic labeling mismatch, results unaffected.

### 4.4 Series evaluation boundaries — correctly applied
Fuel/EV series evaluated separately with category definitions preserved (`PETROL(E20)` distinct;
Electric = Pure EV + Electric-BOV, with the BOV→Pure EV reporting transition documented in EDA
§5). No vehicle-class (2W/4W) claims are made — correctly withheld given the data gap (SRS §4).

### 4.5 Minor gaps
- No external configuration file; hyperparameters are documented only in the script.
- SARIMA model on EV uses a fixed (0,1,1)(0,1,1)₁₂ specification — sensible for the short
  series but not grid-searched; documented, not hidden.

---

## 5. Blockers (unchanged from SRS §4)

1. No vehicle class / engine capacity in registration data → segmentation, insured-exposure
   mapping and class-level pricing analysis blocked.
2. Insurance GDPI is annual (through FY 2024-25) with no OD/TP × Maharashtra monthly detail →
   no econometric linkage to registrations; YTD-vs-full-year labeling discipline required when
   the segment-wise extracts are used.
3. No policy, claims, expense, retention or customer data → actuarial/GTM scenario outputs
   (SRS FR-07…FR-11) can only ever be labeled illustrative in this stage.
4. E20 label ≠ fuel dispensed; no causal claims possible from registrations alone.
5. October 2026 partial (mid-month extract) — excluded until the complete month publishes.

---

## 6. Recommended Next Phase

Per the SRS delivery plan, Phase 3 (forecasting comparison) is now **audited and verified**.
Recommended sequence:

1. **Immediate (housekeeping):** adopt the regenerated metrics CSV as the single source of
   truth; the erratum in the findings report covers the RMSE defect.
2. **Phase 3 completion:** extend rolling-origin evaluation to fuel/EV series (cheap, same
   harness) and add a small config file for model hyperparameters.
3. **Phase 4 — Actuarial & GTM scenario engine:** build the configurable frequency × severity,
   OD/TP-separated scenario module with explicit assumption labels (FR-07…FR-11). This is the
   next value-adding stage and is unblocked; outputs must be labeled illustrative per §5.
4. **Hold the dashboard (SRS FR-13)** until scenario outputs are validated — consistent with
   the task brief.
