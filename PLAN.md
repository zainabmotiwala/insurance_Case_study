# ATSA Project — Plan File

**Project:** Maharashtra Motor Vehicle Registrations & Insurance Analytics (ATSA)
**Created:** 2026-10-20 (companion to `PROGRESS.md`)
Phases 1–4 (data → cleaning → EDA → forecasting) are complete. This plan covers what comes next.

---

## Phase 5 — Vehicle-Class Segmentation (high priority)
**Goal:** Close the 2W/3W/4W confounder identified as the top limitation.

- [ ] Parse `AllIndia_TwoWheeler_VehicleCategoryGroup_FuelType_Annual_2026.xlsx` to
      build a national fuel-share × vehicle-category reference table.
- [ ] Investigate whether VAHAN vehicle-category-group monthly downloads (1W, 2W-N,
      3W, LMV, MGV…) are available for Maharashtra — a fresh scrape/download would
      enable a proper statewide segmented dataset.
- [ ] If statewide category data is unavailable, build a **national-share proxy**:
      allocate statewide monthly fuel registrations to 2W/3W/4W using the All-India
      annual category mix (documented as an assumption).
- [ ] Re-run fuel-share and EV-adoption analysis per segment; quantify how much of
      the EV ramp is 2W vs 4W.
- **Deliverable:** `registrations_segmented.csv` + segment-wise chapter in the report.

## Phase 6 — Insurance Linkage (medium priority)
**Goal:** Connect registration volumes to IRDAI GDPI motor premiums.

- [ ] Convert `gdpi_maharashtra.csv` (FY series, 132 rows) to calendar-fiscal
      alignment with registration years.
- [ ] Correlate Maharashtra motor GDPI (premium, growth) with lagged registration
      volumes — annual frequency limits this to ~8 observations; treat as
      descriptive, not econometric.
- [ ] Use `gdpi_segment_wise.csv` to compare Motor-OD vs Motor-TP insurer trends
      against the powertrain shift (EV/insurance pricing angle).
- **Deliverable:** Insurance-vs-registrations section + 1–2 charts.

## Phase 7 — Fuel-Price & Policy Context (medium priority)
**Goal:** Enrich the demand narrative with price and policy drivers.

- [ ] Join `fuel_prices_clean.csv` (crude, INR/USD, under-recoveries) and
      `retail_prices_clean.csv` to the monthly registration series.
- [ ] Test petrol price elasticity of two-wheeler-heavy aggregate demand (crude,
      given no segmentation yet).
- [ ] Add policy-event timeline to charts: BS6 Phase 2 (2023), E20 phases
      (2023 pilot → 2025 mandate), FAME/PM E-DRIVE, NBFC crisis 2019, COVID 2020-21.
- **Deliverable:** Annotated driver-impact section in the final report.

## Phase 8 — Production Forecasts (high priority)
**Goal:** Turn the benchmark into an actual forward forecast with governance.

- [ ] Refit champion models on the **full** 2017–2026-09 window (no holdout) and
      forecast Oct 2026 → Dec 2027 with prediction intervals.
- [ ] Use the model-per-series routing established in benchmarking:
      SARIMA+COVID-exog for Total/Petrol, seasonal-naive for Diesel,
      gradient boosting for Electric.
- [ ] Add scenario overlays: EV-share S-curve continuation vs saturation;
      E20 share to 100%; downside fuel-price shock.
- [ ] Re-run tests and refresh after each new VAHAN monthly file (Oct 2026
      complete data expected ~Nov 2026).
- **Deliverable:** `production_forecast.csv` + updated forecast charts.

## Phase 9 — Reporting & Packaging (final)
- [ ] Consolidate EDA + benchmark + segmentation + insurance + forecast into one
      final report (Markdown → PDF/DOCX if needed).
- [ ] Initialize git in `Documents\ATSA\`, add `.gitignore` (exclude raw xlsx,
      PDFs, `original data\`), commit cleaned pipeline + code + reports.
- [ ] Optional: simple interactive dashboard (HTML artifact or Streamlit) showing
      statewide trend, fuel shares, E20 penetration and forecast fan chart.
- **Deliverable:** Final report + version-controlled repo (+ optional dashboard).

---

## Suggested Order & Dependencies

```
Phase 5 (segmentation)  ──┐
Phase 7 (fuel prices)   ──┼──> Phase 8 (production forecast, uses all context)
Phase 6 (insurance)     ──┘
                                     └──> Phase 9 (report + git + dashboard)
```

- Phases 5 and 7 can run in parallel; Phase 6 is independent.
- Phase 8 depends on 5 & 7 conclusions (feature set); Phase 9 depends on all.
- Immediate next action: **Phase 5 — check availability of monthly vehicle-category
  VAHAN data for Maharashtra**, since it determines whether segmentation is real
  or proxy-based.
