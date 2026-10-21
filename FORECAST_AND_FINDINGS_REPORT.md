# Forecasting Benchmark & Analytical Findings Report

**Project:** Maharashtra Motor Vehicle Registrations & Insurance Analytics (ATSA)  
**Evaluation Horizon:** Train (`201701`–`202312`) | Validation (`202401`–`202512`) | Test (`202601`–`202609`)  
**Geography:** Maharashtra Statewide (`location_id == 'MH-ALL'`)  
**Date:** October 20, 2026  

---

## 1. Executive Summary & Evaluation Setup

To evaluate vehicle demand dynamics and powertrain substitution in Maharashtra without lookahead bias, we established a standardized out-of-sample benchmark across four distinct forecasting methodologies:

1. **Seasonal-Naive Baseline:** Projects $\hat{Y}_{t} = Y_{t-12}$, establishing the benchmark for cyclical seasonal repeatability.
2. **Holt-Winters Exponential Smoothing:** Classical triple exponential smoothing capturing additive level, additive trend, and additive 12-month seasonality.
3. **SARIMA with Structural Break Indicators:** Seasonal Autoregressive Integrated Moving Average $(p, d, q) \times (P, D, Q)_{12}$ incorporating binary intervention indicators for the March–May 2020 and May 2021 COVID-19 mobility shocks. This isolates the pandemic distortion without deleting any historical observations.
4. **Lagged Gradient Boosting (Zero-Leakage Regressor):** Non-parametric tree ensemble (`HistGradientBoostingRegressor`) using strictly past seasonal lags ($t-12, t-13, t-14, t-24$), rolling lag statistics, calendar features, and intervention flags.

### Benchmark Data Split
* **Training Window:** January 2017 to December 2023 (84 months).
* **Validation Window:** January 2024 to December 2025 (24 months).
* **Final Out-of-Sample Test Window:** January 2026 to September 2026 (9 months).
* **Rolling-Origin Walk-Forward:** 33 rolling forecast origins from January 2024 through September 2026.

---

## 2. Model Performance Comparison & Benchmark Metrics

Evaluation metrics: Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), and Weighted Absolute Percentage Error:
$$\text{WAPE} = \frac{\sum |Y_t - \hat{Y}_t|}{\sum Y_t} \times 100\%$$

### Complete Benchmark Results Table

| Series | Model | Validation MAE | Validation RMSE | Val WAPE % | Test MAE | Test RMSE | Test WAPE % | Overall MAE | Overall RMSE | Overall WAPE % |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Total** | **SARIMA (COVID-exog)** | **25,817.0** | **31,778.6** | **10.03%** | **19,517.0** | **23,178.6** | **6.73%** | **24,098.8** | **29,715.4** | **9.05%** |
| Total | Seasonal-Naive Baseline | 32,371.5 | 45,959.0 | 12.58% | 49,681.1 | 55,595.6 | 17.13% | 37,092.3 | 48,799.4 | 13.93% |
| Total | Lagged Gradient Boosting | 44,017.4 | 55,618.3 | 17.11% | 35,590.9 | 43,607.7 | 12.27% | 41,719.3 | 52,668.6 | 15.67% |
| Total | Holt-Winters | 87,643.5 | 96,730.0 | 34.06% | 13,150.4 | 15,221.7 | 4.53% | 67,327.2 | 83,576.7 | 25.29% |
| **Petrol Combined** | **SARIMA (COVID-exog)** | **22,336.0** | **27,511.4** | **12.53%** | **18,001.9** | **21,570.6** | **9.16%** | **21,154.0** | **26,057.9** | **11.54%** |
| Petrol Combined | Seasonal-Naive Baseline | 22,535.9 | 32,492.2 | 12.64% | 34,225.3 | 39,267.4 | 17.42% | 25,723.9 | 34,482.4 | 14.04% |
| Petrol Combined | Lagged Gradient Boosting | 31,315.5 | 39,788.0 | 17.56% | 23,058.3 | 29,355.8 | 11.74% | 29,063.5 | 37,272.9 | 15.86% |
| Petrol Combined | Holt-Winters | 41,635.9 | 49,949.1 | 23.35% | 20,273.2 | 23,733.9 | 10.32% | 35,809.7 | 44,481.5 | 19.54% |
| **Diesel** | **Seasonal-Naive Baseline**| **5,205.0** | **6,478.4** | **17.38%** | **3,019.2** | **3,723.0** | **9.73%** | **4,608.9** | **5,876.3** | **15.24%** |
| Diesel | Lagged Gradient Boosting | 6,510.6 | 8,300.9 | 21.74% | 9,927.7 | 10,816.6 | 31.99% | 7,442.6 | 9,067.8 | 24.61% |
| Diesel | SARIMA (COVID-exog) | 7,089.9 | 8,970.3 | 23.67% | 11,180.0 | 12,086.8 | 36.03% | 8,205.4 | 9,936.5 | 27.13% |
| Diesel | Holt-Winters | 14,230.9 | 15,316.5 | 47.52% | 13,972.2 | 14,642.6 | 45.03% | 14,160.4 | 15,135.1 | 46.82% |
| **Electric** | **Lagged Gradient Boosting**| **3,867.6** | **4,923.4** | **18.26%** | **8,687.1** | **9,505.7** | **27.34%** | **5,182.0** | **6,516.3** | **21.53%** |
| Electric | SARIMA (COVID-exog) | 3,980.5 | 4,964.7 | 18.79% | 8,753.8 | 9,471.1 | 27.55% | 5,282.3 | 6,527.2 | 21.95% |
| Electric | Holt-Winters | 3,933.6 | 4,879.4 | 18.57% | 9,661.6 | 10,642.5 | 30.41% | 5,495.7 | 6,913.3 | 22.83% |
| Electric | Seasonal-Naive Baseline | 4,144.8 | 5,257.7 | 19.57% | 10,205.8 | 11,048.9 | 32.12% | 5,797.8 | 7,270.3 | 24.09% |

---

## 3. Analysis of Model Dynamics & Key Findings

### Finding 1: SARIMA with COVID Exogenous Conditioning is the Superior Aggregate Model
* For **Total Registrations**, **SARIMA $(1,1,1)(1,1,0)_{12}$ with COVID exogenous indicators** achieved the best overall accuracy:
  * **Overall MAE:** `24,098.8` units
  * **Overall WAPE:** `9.05%` (Test WAPE dropped to a remarkable `6.73%` in 2026).
* **Mechanism:** By incorporating binary pulse regressors for March–May 2020 and May 2021, SARIMA prevented the pandemic collapse from distorting the seasonal differencing and autoregressive terms. When forecasting forward into 2024–2026, setting the exogenous variables to 0 allowed the model to extrapolate true underlying growth without post-pandemic scarring.

### Finding 2: Unadjusted Holt-Winters Suffers from Parameter Distortion
* Holt-Winters triple exponential smoothing produced a high error on the validation set (**Val WAPE: 34.06%**), over-projecting trend decline because the 2020 collapse severely dragged down the estimated slope parameter $\beta$.
* However, when updated at the end of 2025 (incorporating 2024–2025 normalized volume), Holt-Winters adjusted rapidly, delivering **Test WAPE of 4.53%** in 2026. This confirms that Holt-Winters requires clean, shock-free historical windows to estimate valid trend smoothing parameters.

### Finding 3: Gradient Boosting Excels in Non-Linear Regimes (EVs) but Faces Sample-Size Constraints
* On **Electric Vehicle registrations**, **Lagged Gradient Boosting** outperformed all parametric models (**Overall WAPE: 21.53%**, Val WAPE: 18.26%). Tree-based splitting easily accommodated the exponential non-linear ramp in EV registrations from 2022 to 2026.
* On aggregate Total and Petrol series, Gradient Boosting achieved an Overall WAPE of `15.67%`. While competitive, it was constrained by the 84-month training sample size, as decision trees require larger observation counts to partition multi-dimensional lag spaces without step-function flattening.

### Finding 4: Diesel Fleet Stability Favors Naive Persistence
* For **Diesel registrations**, the **Seasonal-Naive baseline** achieved the lowest Overall WAPE (`15.24%`). Diesel in Maharashtra has stabilized into an institutional and commercial steady-state (11%–15% market share), exhibiting consistent 12-month cyclical repetition with low secular growth.

---

## 4. Rolling-Origin Backtesting (Walk-Forward Validation)

To simulate true production deployment, we executed rolling 1-step ahead walk-forward backtesting across **33 sequential forecast origins** (every month from January 2024 to September 2026). At each step $t$, models were fitted strictly on data up to $t-1$ and forecasted $t$.

```
Rolling-Origin 1-Step Ahead Performance (33 Walk-Forward Horizons)
-----------------------------------------------------------------
Model                     Average MAE (Units)    WAPE (%)
Seasonal-Naive Baseline   37,092.3 units         13.93%
SARIMA (COVID-exog)       24,948.4 units          9.37%
-----------------------------------------------------------------
Performance Advantage:    SARIMA reduces forecast error by 32.7%
```

* **Stability:** In 29 of the 33 evaluation months, SARIMA generated lower absolute errors than the seasonal-naive baseline, confirming that the model's predictive power is structural rather than an artifact of a single split boundary.

---

## 5. Residual Diagnostics

We conducted diagnostic checks on the out-of-sample forecast residuals ($e_t = Y_t - \hat{Y}_t$) for the champion SARIMA model on Total Registrations:

```
Ljung-Box Test on SARIMA Forecast Residuals:
Lag (m)    LB Test Statistic    p-value    Diagnostic Interpretation
Lag 6      3.9438               0.6843     p > 0.05: No remaining autocorrelation
Lag 12     11.7728              0.4641     p > 0.05: White-noise residual sequence
```

* **Autocorrelation:** The Ljung-Box test confirms that errors are uncorrelated at both 6-month and 12-month seasonal lags, verifying that the model has successfully extracted all systematic linear structure.
* **Normality:** Q-Q plots reveal that residuals conform closely to the normal reference line, with moderate positive tail dispersion driven exclusively by the record October 2025 festive delivery peak.

---

## 6. Unresolved Issues & Methodological Limitations

1. **Unsegmented Vehicle Classes (The 2W vs. 4W Confounder):**
   * *Limitation:* All VAHAN monthly fuel files in Maharashtra pool motorcycles, scooters, private cars, auto-rickshaws, and heavy trucks into a single total.
   * *Impact:* Because EV adoption is overwhelmingly concentrated in two-wheelers and three-wheelers, while diesel is concentrated in commercial vehicles and SUVs, fuel-share dynamics cannot be attributed to specific buyer segments.
2. **Administrative Labeling vs. Fuel Blending Realities:**
   * *Limitation:* VAHAN registers vehicle engine compliance certificates (`Petrol-E20`). It does not record OMC physical fuel delivery.
   * *Impact:* An analyst cannot infer that E20 vehicles consume E20 fuel, or that standard Petrol vehicles consume E0/E10. Retail fuel at fuel pumps is uniformly blended across Maharashtra.
3. **Absence of Monthly Insurance Frequency:**
   * *Limitation:* Maharashtra motor insurance data (IRDAI Table 42) exists only as an **annual total** ending in FY 2024-25.
   * *Impact:* Time-series econometric models (SARIMA, Holt-Winters, Gradient Boosting) cannot be run on insurance premiums or loss ratios at monthly frequency.
4. **COVID-19 Structural Break Requirement:**
   * *Limitation:* Time-series models fitted on 2017–2023 require permanent exogenous conditioning for the 2020–2021 shock. Any attempt to fit unadjusted univariate models (such as basic Holt-Winters) results in severe parameter bias.
5. **Mid-Month Cutoff for October 2026:**
   * *Limitation:* October 2026 data in the raw files was extracted mid-month (October 19/20, 2026), capturing only ~46% of regular monthly registrations. It must remain excluded from time-series benchmarks.

---

## 7. Deliverables Index

All code, tests, datasets, notebooks, and visualizations have been created, validated, and saved to the project directory:

| Deliverable Type | File Path | Status |
| :--- | :--- | :---: |
| **Clean Master Dataset** | [`registrations_clean.csv`](file:///c:/Users/Zainab%20Motiwala/Documents/ATSA/registrations_clean.csv) | Verified (8,263 rows) |
| **Analytical Time-Series Dataset** | [`registrations_analytical.csv`](file:///c:/Users/Zainab%20Motiwala/Documents/ATSA/registrations_analytical.csv) | Verified (7,992 rows) |
| **Statewide Monthly Dataset** | [`registrations_maharashtra_monthly.csv`](file:///c:/Users/Zainab%20Motiwala/Documents/ATSA/registrations_maharashtra_monthly.csv) | Verified (1,540 rows) |
| **Data Dictionary & Fuel Mapping** | [`DATA_DICTIONARY_AND_MAPPING.md`](file:///c:/Users/Zainab%20Motiwala/Documents/ATSA/DATA_DICTIONARY_AND_MAPPING.md) | Documented |
| **Transformation Code** | [`rebuild_registrations.py`](file:///c:/Users/Zainab%20Motiwala/Documents/ATSA/rebuild_registrations.py) | Tested & Reproducible |
| **Automated Unit Tests** | [`test_registration_data.py`](file:///c:/Users/Zainab%20Motiwala/Documents/ATSA/test_registration_data.py) | **10/10 PASS** |
| **Market EDA Notebook** | [`market_eda.ipynb`](file:///c:/Users/Zainab%20Motiwala/Documents/ATSA/market_eda.ipynb) | Created (Valid v4) |
| **Forecast Benchmark Script** | [`forecast_comparison.py`](file:///c:/Users/Zainab%20Motiwala/Documents/ATSA/forecast_comparison.py) | Executed (Exit Code 0) |
| **Forecast Benchmark Notebook** | [`forecast_comparison.ipynb`](file:///c:/Users/Zainab%20Motiwala/Documents/ATSA/forecast_comparison.ipynb) | Created (Valid v4) |
| **Forecast Metrics Table** | [`forecast_metrics_summary.csv`](file:///c:/Users/Zainab%20Motiwala/Documents/ATSA/forecast_metrics_summary.csv) | Exported |
| **Rolling-Origin Metrics Table** | [`rolling_origin_metrics.csv`](file:///c:/Users/Zainab%20Motiwala/Documents/ATSA/rolling_origin_metrics.csv) | Exported |
| **Plot: Total Forecast & Intervals** | [`forecast_comparison_total.png`](file:///c:/Users/Zainab%20Motiwala/Documents/ATSA/forecast_comparison_total.png) | Generated (150 DPI) |
| **Plot: Powertrain Forecasts** | [`forecast_comparison_fuel_groups.png`](file:///c:/Users/Zainab%20Motiwala/Documents/ATSA/forecast_comparison_fuel_groups.png) | Generated (150 DPI) |
| **Plot: Residual Diagnostics** | [`residual_diagnostics.png`](file:///c:/Users/Zainab%20Motiwala/Documents/ATSA/residual_diagnostics.png) | Generated (150 DPI) |
| **Plot: Rolling-Origin Performance** | [`rolling_origin_performance.png`](file:///c:/Users/Zainab%20Motiwala/Documents/ATSA/rolling_origin_performance.png) | Generated (150 DPI) 