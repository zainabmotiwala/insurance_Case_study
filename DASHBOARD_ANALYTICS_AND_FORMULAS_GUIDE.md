# Maharashtra Motor Insurance Intelligence Platform
# Comprehensive Dashboard Guide: Theory, Inferences, Findings & Actuarial Formulas

**Document Version:** 2.1 (Authoritative Master Reference: Algorithm Values & Tuning Decisions Added)  
**Evaluation Horizon:** 201701–202609 (Train: 2017–2023 | Validation: 2024–2025 | Test: 202601–202609)  
**Geography:** Maharashtra Statewide (`MH-ALL`) & 7 Monitored Regional Transport Offices (RTOs)  
**Data Sources:** Ministry of Road Transport & Highways (VAHAN), Insurance Regulatory and Development Authority of India (IRDAI Table 42)  

---

## 1. Executive Summary & Dashboard Architecture

The **Maharashtra Motor Insurance Intelligence Platform** is an enterprise-grade analytical system designed to bridge automotive registration trends, econometric time-series forecasting, actuarial underwriting economics, and commercial Go-To-Market (GTM) strategy.

The dashboard translates **8,263 verified transaction rows** across 117 consecutive months into actionable intelligence across five distinct analytical pillars:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                   MAHARASHTRA MOTOR INSURANCE INTELLIGENCE PLATFORM               │
├─────────────────┬─────────────────┬─────────────────┬──────────────┬─────────────┤
│   ① SUMMARY     │   ② BALANCE     │  ③ SPENDING     │  ④ INCOME    │   ⑤ GTM     │
│ Macro Trends,   │ Stationary YoY, │ Actuarial Risk, │ SARIMA       │ Retention,  │
│ Seasonality,    │ Spatial RTO     │ Pure Premium,   │ Benchmark,   │ EV Battery, │
│ EV / E20 Mix    │ Heterogeneity   │ Underwriting COR│ Residuals    │ Territorial │
└─────────────────┴─────────────────┴─────────────────┴──────────────┴─────────────┘
```

---

## 2. Tab-by-Tab Analytical Breakdown & Theoretical Inferences

### Tab 1: ① Summary (Macro Registrations, Seasonality & Powertrain Mix)

#### Purpose & Scope
Provides an executive-level overview of statewide automotive demand, cyclical festive swings, and secular powertrain transitions across Maharashtra.

#### Visualizations & Components
1. **KPI Strip:** 
   - 2026 Registrations (9M YTD: 2.61M units, +21.4% YoY vs 9M 2025).
   - Latest Month Volume (Sep 2026: 302,528 units, observed).
   - E20 Compliance Penetration (Sep 2026: 71.3% of petrol registrations).
   - EV Market Share (Sep 2026: 10.9% of total registrations).
   - 2025 Full-Year Volume (2.85M units, record calendar year).
2. **Annual Powertrain Stacked Bar Chart (2017–2026):** Visualizes structural fuel transitions over 10 years.
3. **Monthly Total Registrations (Rolling 36M Area Chart):** Highlights seasonal wave morphology and post-monsoon peaks.
4. **E20 & EV Adoption Trajectory (Dual Line Chart):** Tracks the simultaneous rise of EV and E20 powertrain certifications.
5. **Fuel Mix Donut Chart (Sep 2026 Snapshot):** Displays current fleet composition (Petrol-Std, Petrol-E20, Diesel, EV, CNG, Hybrid).
6. **Seasonal Factors Bar Chart:** Centred Moving Average seasonal component for each calendar month.

#### Theoretical Inferences on Tab 1
* **Additive Decomposition of Vehicle Demand:**  
  Vehicle registrations follow an additive decomposition $Y_t = T_t + S_t + \epsilon_t$. Seasonality accounts for ~28% of total monthly variance. October (+53,257 units) and November (+80,156 units) exhibit massive positive shocks driven by auspicious festive buying during Navratri, Dussehra, and Diwali. Conversely, May (–44,352 units) and June (–42,921 units) suffer from the pre-monsoon agricultural cash-lock and monsoon travel suppression.
* **Logistic S-Curve Inflection for EVs (Bass Diffusion Model):**  
  Electric vehicles transitioned from the "innovator" phase (<0.5% market share in 2019–2020) past the 2.5% tipping point in 2022 into the "early majority" corridor, stabilizing near ~11% by late 2026. This adoption curve adheres to classic Bass diffusion dynamics driven by charging station rollout, OEM model proliferation (especially electric 2-wheelers and 3-wheelers), and state subsidy interventions.
* **Supply-Side Mandated Transition (E20 Compliance):**  
  The rapid emergence of `Petrol-E20` registrations (0% in 2021 → 71.3% in Sep 2026) is **not** an indicator of consumer preference or retail fuel consumption. It reflects automobile manufacturer compliance with Ministry of Road Transport & Highways (MoRTH) BS-VI Phase-II Real Driving Emissions (RDE) norms, which mandated E20 engine compatibility.
* **Diesel Secular Plateau:**  
  Diesel registrations have contracted from ~25% down to an institutional floor of 11–13%. Diesel demand has decoupled from personal mobility and is now confined to commercial freight haulage, agricultural machinery, and long-range fleet cabs where battery energy density remains inadequate.

---

### Tab 2: ② Balance & Registrations (Growth Rates, RTO Geography & Concentration)

#### Purpose & Scope
Evaluates time-series stationarity, year-on-year growth momentum, and spatial heterogeneity across 7 monitored regional transport offices (Mumbai, Thane, Pune, Nashik, Aurangabad, Pimpri-Chinchwad, and Vashi).

#### Visualizations & Components
1. **Historical Monthly Powertrain Area Chart (2019–2026):** Stacked time-series illustrating monthly volume composition.
2. **Year-on-Year Growth Rate Bar Chart:** Rolling 12-month percentage growth rates with color-coded positive/negative bars.
3. **RTO Annual Registrations Grouped Bar Chart (2022–2026):** Comparative office-level volume delivery.
4. **RTO Performance & Powertrain Summary Table (2025):** Total registrations, EV share, E20 share, and YoY growth per territory.

#### Theoretical Inferences on Tab 2
* **Lag-12 Differencing & Stationarity:**  
  Raw registration series $Y_t$ exhibit non-stationarity in mean (upward trend) and seasonal non-stationarity ($I(1)_{12}$). Applying 12-month percentage differencing $\text{YoY}_t = \frac{\Delta_{12} Y_t}{Y_{t-12}} \times 100$ removes the cyclical seasonal baseline, revealing that underlying secular momentum stabilized between +8% and +22% YoY following post-COVID normalization.
* **Pulse Shocks vs. Regime Shifts:**  
  The catastrophic –92% YoY drop in April 2020 and subsequent +140% surge in April 2021 represent exogenous administrative pulse interventions (lockdown closures of RTO offices and dealerships). Treating these swings as endogenous economic inflection points distorts parameter estimation; econometric models must treat them as pulse intervention dummies $I_{\text{covid}}(t)$.
* **Spatial Concentration & Geographic Disparity:**  
  Automotive demand in Maharashtra exhibits extreme spatial clustering. Pune (`MH-12`), Pimpri-Chinchwad (`MH-14`), and Thane (`MH-04`) generate over 50% of total registrations across the 7 monitored RTOs. Pune and Pimpri lead the state in EV adoption (>11.5% EV share) due to higher per-capita IT-corridor income and high public charger density. Conversely, semi-urban RTOs (Nashik, Aurangabad) trail at 5–7% EV share.
* **The Ecological Fallacy Caveat:**  
  The 7 monitored RTOs represent high-density municipal corporations and encompass only ~35–40% of Maharashtra's total vehicle pool. High EV adoption observed in Pune cannot be generalized to rural districts (Vidarbha, Marathwada), where two-wheelers remain predominantly standard ICE and rural grid reliability is lower.

---

### Tab 3: ③ Spending / Actuarial & Underwriting Economics

#### Purpose & Scope
Models the economics of insurance balance sheets by juxtaposing observed historical premium growth (IRDAI Table 42) against actuarial collective risk theory (frequency $\times$ severity), underwriting expense structures, and combined operating ratios.

#### Visualizations & Components
1. **Observed Motor GDPI KPIs (FY 2024-25):** 
   - Motor Own Damage GDPI (₹5,752 Cr, +18.1% YoY).
   - Motor Third Party GDPI (₹5,768 Cr, +18.3% YoY).
   - Motor Share of Total General Insurance (39.4%).
   - OD/TP Balance Ratio (1.00).
2. **Motor OD vs TP GDPI Historical Bar Chart (FY 2017-18 to 2024-25):** Annual growth across both statutory and deregulated segments.
3. **Frequency $\times$ Severity OD Loss Ratio Sensitivity Grid:** Contour lines demonstrating Loss Ratio behavior under claim frequencies from 5% to 15% and severities from ₹14,000 to ₹24,000.
4. **Interactive Actuarial Scenario Engine:** 6 interactive sliders allowing underwriters to stress-test fleet size, insurance penetration, claim frequency, average severity, expense ratios, and TP loss ratios to compute resulting Combined Operating Ratios and underwriting surpluses/deficits.

#### Theoretical Inferences on Tab 3
* **Structural Pricing Bifurcation (Deregulated OD vs. Tariff-Administered TP):**  
  Motor Own Damage (OD) was detariffed by the Insurance Regulatory and Development Authority of India (IRDAI) in 2007, granting insurers the statutory freedom to price risks based on vehicle age, powertrain, geographic zone, and driver profiles. Conversely, Motor Third Party (TP) liability remains strictly governed under Section 146/147 of the Motor Vehicles Act 1988 (amended 2019), with premium rates capped annually by IRDAI.
* **The TP Structural Deficit & Cross-Subsidization:**  
  Because Indian law mandates unlimited financial liability for third-party bodily injury and fatal accidents, and because Motor Accident Claims Tribunals (MACT) face litigation settlement horizons averaging 3 to 7 years, industry TP loss ratios consistently exceed 110% to 135%. Consequently, general insurers cannot generate underwriting profits on TP alone; solvency depends entirely on generating positive underwriting margins in Motor OD and earning investment returns on the long-tail claims float.
* **Collective Risk Model & Break-Even Frequency Constraint:**  
  Under Cramér-Lundberg risk theory, the pure premium (burn cost) represents the product of claim frequency $f$ and average severity $S$. With an operating expense ratio $e$, the maximum allowable frequency before incurring an underwriting loss (Combined Ratio $> 100\%$) is strictly bounded by:
  $$f^* = \frac{\text{GWP}_{\text{OD}} \times (1 - e)}{S}$$
  At an average OD premium of ₹4,200, an expense ratio of 32%, and a severity of ₹18,000, the portfolio breaks even at a claim frequency of exactly **15.8%**. A 1.0% increase in frequency erodes ~₹35.8 Crore of statewide underwriting profit.
* **EV Severity Inflation Risk:**  
  While electric vehicles exhibit lower scheduled maintenance costs, insurance claims data indicates a 25% to 40% increase in average collision repair severity. Battery packs constitute 40% to 50% of total EV vehicle value. Due to the lack of component-level repair protocols and the risk of thermal runaway, minor structural underbody impacts frequently force complete battery pack replacement, triggering constructive total losses (CTL).

---

### Tab 4: ④ Income / Forecasting & Model Diagnostics

#### Purpose & Scope
Presents the authoritative out-of-sample econometric benchmark comparing 4 predictive methodologies across 33 walk-forward horizons, backed by white-noise residual diagnostic testing.

#### Visualizations & Components
1. **Observed Motor GDPI vs Total General Insurance Trend (FY 2014-15 to 2024-25):** 10-year historical trajectory.
2. **Rolling-Origin Walk-Forward Chart (33 Months):** Actual vs. SARIMA vs. Seasonal Naive forecasts from Jan 2024 through Sep 2026.
3. **1-Step Ahead Absolute Residual Error Bar Chart:** Monthly absolute error comparison separating Validation (2024–2025) and Test (2026) windows.
4. **Authoritative Model Performance Summary Tables:** Comprehensive MAE, RMSE, and WAPE across Total, Petrol Combined, Diesel, and Electric series (`forecast_metrics_summary.csv`).

#### Theoretical Inferences on Tab 4
* **Superiority of SARIMA with Exogenous Pulse Conditioning:**  
  For aggregate Total registrations, $\text{SARIMA}(1,1,1)(1,1,0)_{12}$ conditioned with exogenous binary pulse regressors for the March–May 2020 and May 2021 lockdowns emerged as the undisputed champion:
  - **Overall WAPE:** 9.05%
  - **Out-of-Sample Test WAPE (2026):** **6.73%**
  - **Rolling Walk-Forward MAE:** 24,948 units (vs. 37,092 units for Seasonal Naive).
  - **Forecast Error Reduction:** **32.7% error reduction** over the baseline, outperforming Seasonal Naive in 29 of 33 evaluation months.
* **Parameter Corruption in Unadjusted Holt-Winters:**  
  Unadjusted Holt-Winters triple exponential smoothing failed severely during the validation window (**Val WAPE: 34.06%**). Because the 2020 lockdown collapsed registrations by 42%, the exponential smoothing update equation for the trend slope ($\beta$) estimated a permanent secular contraction. When re-estimated on clean 2024–2025 data, test error dropped to 4.53%, proving that exponential smoothing requires shock-free baselines.
* **Inductive Biases across Powertrain Granularities:**  
  Different powertrain dynamics favor distinct econometric formulations:
  - **Electric Vehicles (Non-Linear Growth):** Lagged Gradient Boosting (`HistGradientBoostingRegressor`) achieved champion performance (**Overall WAPE: 21.53%**). Tree-based recursive partitioning captured exponential S-curve inflection and policy shifts (e.g., FAME-II subsidy expiration) far better than linear autoregressive equations.
  - **Diesel (Maturity & Cyclical Persistence):** The Seasonal-Naive baseline achieved the lowest error (**Overall WAPE: 15.24%**). Diesel registrations have matured into a pure cyclical renewal pattern with zero secular trend growth, making last year's value the most efficient unbiased estimator.
* **Residual Whiteness & Absence of Autocorrelation:**  
  Ljung-Box diagnostic tests on out-of-sample SARIMA residuals yielded $Q(6) = 3.94$ ($p = 0.684$) and $Q(12) = 11.77$ ($p = 0.464$). Because both $p > 0.05$, the null hypothesis cannot be rejected: the forecast residuals constitute an uncorrelated white-noise sequence, proving that the model successfully extracted all systematic linear predictable signal.

---

### Tab 5: ⑤ Net Income & Go-To-Market (GTM) Strategy

#### Purpose & Scope
Translates statistical and actuarial findings into commercial underwriting and distribution strategies, quantifying revenue levers across policy renewals, uninsured vehicle recovery, EV specialty underwriting, and warranty add-on products.

#### Visualizations & Components
1. **GTM KPI Strip:** 2026 YTD EV units (285.9K), E20-labelled units (845K), EV fleet share (~10.9%), and E20 pricing adjustment (–4% scenario discount).
2. **EV Registration Growth Composed Chart (2019–2026):** Annual bar volume against percentage share line.
3. **RTO Territorial Prioritization Matrix:** Weighted index ranking 7 RTOs on EV adoption, market volume growth, and compliance readiness.
4. **Interactive GTM Scenario Engine:** 4 sliders (Target Retention Rate, Uninsured Gap Capture Rate, EV Premium Uplift, Add-on Penetration Rate) computing potential gross written premium additions.
5. **E20 Protect Product Concept Matrix:** Value proposition, pricing mechanics, and actuarial risk boundaries for ethanol-blend engine protection riders.

#### Theoretical Inferences on Tab 5
* **The Multi-Year Policy Expiry Cliff:**  
  Under IRDAI regulations enacted in September 2018, all new two-wheelers must be sold with a **5-year mandatory TP policy** and new private cars with a **3-year mandatory TP policy**. To minimize initial purchase prices, dealerships bundle these statutory TP covers with a **1-year standalone Own Damage (OD)** policy. Consequently, when the Year-1 OD policy expires, customers face no regulatory pressure to renew OD because their TP certificate remains legally valid for 3 to 5 years. This generates a **35% to 45% renewal drop-off cliff** at Month 12, representing the single largest source of customer lifetime value (LTV) destruction for insurers.
* **Uninsured Vehicle Gap Economics:**  
  Industry data indicates that ~45% of four-wheelers and over 65% of two-wheelers operating on Indian roads lack active Own Damage insurance. In Maharashtra, this represents an uninsured fleet exceeding 1.4 million vehicles. Re-engaging this lapsed pool via instant digital inspection (AI photo inspection via smartphone) allows insurers to capture new OD policies at significantly lower customer acquisition cost (CAC) than dealership point-of-sale commissions.
* **High-Yield Geographic Clusters:**  
  Commercial expansion should prioritize territorial clusters rather than uniform statewide marketing. Pune (`MH-12`), Pimpri-Chinchwad (`MH-14`), and Thane (`MH-04`) combine high vehicle volume with affluent buyer demographics, resulting in initial OD policy attachment rates exceeding 80%. Dedicated broker integrations and digital direct-to-consumer campaigns in these three corridors yield the highest underwriting margin per dollar of marketing spend.

---

## 3. Mathematical Formulas & Quantitative Methodologies

Below is the exhaustive mathematical inventory of all equations implemented across the platform.

### A. Time-Series Econometrics & Decomposition

#### 1. Additive Classical Time-Series Decomposition
$$Y_t = T_t + S_t + \epsilon_t$$
* $Y_t$: Observed vehicle registrations at calendar month $t$.
* $T_t$: Centred 12-month moving average trend component:
  $$T_t = \frac{1}{24} \left( Y_{t-6} + 2\sum_{k=-5}^{5} Y_{t+k} + Y_{t+6} \right)$$
* $S_t$: Seasonal factor for month $m \in \{1, \dots, 12\}$, normalized such that $\sum_{m=1}^{12} S_m = 0$.
* $\epsilon_t$: Irregular residual component capturing random fluctuations and unmodelled interventions.

#### 2. Year-on-Year Growth Rate (Lag-12 Differencing)
$$\text{YoY}_t = \left( \frac{Y_t - Y_{t-12}}{Y_{t-12}} \right) \times 100 = \left( \frac{\Delta_{12} Y_t}{Y_{t-12}} \right) \times 100$$
* $\Delta_{12} = (1 - B^{12})$: Seasonal lag operator removing annual cyclical seasonality.

#### 3. SARIMA with Exogenous Pulse Interventions
$$\Phi_P(B^s) \phi_p(B) (1 - B)^d (1 - B^s)^D Y_t = \Theta_Q(B^s) \theta_q(B) \epsilon_t + \sum_{k=1}^K \beta_k I_k(t)$$
* In our champion model: $\text{SARIMA}(1,1,1)(1,1,0)_{12}$ with $d=1, D=1, s=12$:
  $$(1 - \phi_1 B)(1 - \Phi_1 B^{12})(1 - B)(1 - B^{12}) Y_t = (1 + \theta_1 B) \epsilon_t + \beta_1 I_{\text{mar20-may20}}(t) + \beta_2 I_{\text{may21}}(t)$$
* $B$: Backshift operator defined by $B^k Y_t = Y_{t-k}$.
* $I_k(t)$: Exogenous binary indicator ($1$ during lockdown shock months, $0$ elsewhere), preventing COVID collapse from biasing autoregressive and moving average parameters.

#### 4. Seasonal Naive Benchmark
$$\hat{Y}_{t+h} = Y_{t+h - 12}$$
* Sets the out-of-sample forecast equal to the observation recorded in the identical month of the previous year.

---

### B. Forecast Evaluation Metrics

| Metric | Mathematical Formula | Key Advantage & Application |
| :--- | :--- | :--- |
| **Mean Absolute Error (MAE)** | $\text{MAE} = \frac{1}{n} \sum_{t=1}^n \|Y_t - \hat{Y}_t\|$ | Expresses forecast error directly in natural vehicle registration units. |
| **Root Mean Squared Error (RMSE)** | $\text{RMSE} = \sqrt{\frac{1}{n} \sum_{t=1}^n (Y_t - \hat{Y}_t)^2}$ | Penalizes large outlier errors quadratically; sensitive to festive peak errors. |
| **Weighted Absolute Percentage Error (WAPE)** | $\text{WAPE} = \frac{\sum_{t=1}^n \|Y_t - \hat{Y}_t\|}{\sum_{t=1}^n Y_t} \times 100\%$ | **Primary platform benchmark metric.** Avoids MAPE division-by-zero on low series; volume-weighted. |

#### Ljung-Box Portmanteau Test for Residual Whiteness
$$Q(m) = n(n+2) \sum_{k=1}^m \frac{r_k^2}{n - k} \sim \chi^2(m - p - q)$$
* $n$: Number of out-of-sample forecast observations.
* $r_k$: Sample autocorrelation of forecast residuals at lag $k$.
* $m$: Maximum test lag ($m=6, m=12$).
* Null hypothesis $H_0$: Residuals are independent white noise ($p > 0.05$).

---

### C. Actuarial Risk & Underwriting Mathematics

#### 1. Pure Premium (Burn Cost)
$$PP = \text{Frequency} \times \text{Severity} = f \times S = \left( \frac{N_{\text{claims}}}{E_{\text{vehicles}}} \right) \times \left( \frac{C_{\text{incurred}}}{N_{\text{claims}}} \right)$$
* $N_{\text{claims}}$: Total number of settled and reported claims.
* $E_{\text{vehicles}}$: Exposed vehicle risk years.
* $C_{\text{incurred}}$: Total claims incurred (paid losses + change in outstanding case reserves + IBNR).

#### 2. Gross Written Premium (GWP) Required
$$\text{GWP} = \frac{PP}{1 - e - \pi}$$
* $e$: Expense ratio (acquisition commission + operating management expenses as % of GWP).
* $\pi$: Target underwriting profit margin (e.g., 0.05 for 5%).

#### 3. Loss Ratio (LR)
$$\text{LR} = \left( \frac{\text{Net Incurred Claims}}{\text{Net Earned Premium}} \right) \times 100\%$$

#### 4. Combined Operating Ratio (COR)
$$\text{COR} = \text{Loss Ratio} + \text{Expense Ratio} = \frac{\text{Claims Incurred}}{\text{Earned Premium}} + \frac{\text{Operating Expenses} + \text{Net Commission}}{\text{Written Premium}}$$
* $\text{COR} < 100\%$: Underwriting surplus (profit before investment income).
* $\text{COR} > 100\%$: Underwriting deficit (loss-making insurance operations).

#### 5. Underwriting Result
$$\text{UW Result} = \text{GWP} \times (1 - \text{COR})$$

#### 6. Break-Even Claim Frequency Threshold ($f^*$)
$$f^* = \frac{\text{GWP} \times (1 - e)}{S}$$
* Defines the maximum sustainable claim frequency before the Combined Ratio breaches 100%.

---

### D. Go-To-Market Economics & Territorial Scoring

#### 1. Territorial Prioritization Composite Index
$$\text{Priority Score}_i = 0.40 \cdot \text{EV Score}_i + 0.35 \cdot \text{Growth Score}_i + 0.25 \cdot \text{E20 Score}_i$$
* Weights normalized RTO indicators to rank commercial attractiveness (0–100 scale).

#### 2. Strategic Revenue Uplift Potential
$$\Delta \text{Revenue}_{\text{Total}} = \Delta \text{Rev}_{\text{Retention}} + \text{Rev}_{\text{Uninsured}} + \text{Rev}_{\text{EV}} + \text{Rev}_{\text{E20}} + \text{Rev}_{\text{Add-ons}}$$
Where:
* **Retention Uplift:** $\Delta \text{Rev}_{\text{Retention}} = N_{\text{fleet}} \times (\text{Retention}_{\text{target}} - \text{Retention}_{\text{base}}) \times \text{Avg Renewal Premium}$
* **Uninsured Gap Capture:** $\text{Rev}_{\text{Uninsured}} = (N_{\text{fleet}} \times \text{Uninsured Rate}) \times \text{Capture Rate} \times \text{Avg OD Premium}$
* **EV Portfolio Expansion:** $\text{Rev}_{\text{EV}} = N_{\text{EV}} \times \text{Conversion Rate} \times \text{Avg OD Premium} \times (1 + \text{Uplift}_{\text{parts}})$
* **Add-On Attach Revenue:** $\text{Rev}_{\text{Add-ons}} = N_{\text{insured}} \times \text{Attach Rate} \times \text{Add-on Premium}$

---

## 4. Algorithm Values, Parameter Calibration & Decision Rationale

This section details the empirical, statistical, and actuarial justification for every algorithmic parameter, model order, hyperparameter, split horizon, and scenario baseline implemented across the platform.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                   ALGORITHM & PARAMETER DECISION ARCHITECTURE                     │
├─────────────────┬─────────────────┬──────────────────┬──────────────┬────────────┤
│  SARIMA ORDERS  │ EXOGENOUS PULSE │ GRADIENT BOOST   │ HOLT-WINTERS │ ACTUARIAL  │
│  (p,d,q)(P,D,Q) │ COVID Interv.   │ Lags (12,13,14)  │ Additive Mix │ Calibration│
│  AIC + ACF/PACF │ Bias Prevention │ Multi-Step Leak  │ Season = 12  │ IRDAI/GIC  │
└─────────────────┴─────────────────┴──────────────────┴──────────────┴────────────┘
```

---

### A. SARIMA Model Orders & Statistical Identification

The platform implements Seasonal Autoregressive Integrated Moving Average models via `statsmodels.tsa.statespace.sarimax.SARIMAX`. The selection of polynomial orders $(p, d, q) \times (P, D, Q)_{s}$ was determined through a rigorous three-step econometric protocol:

#### 1. Integration & Differencing Orders ($d = 1, D = 1, s = 12$)
* **Stationarity Testing:** The raw statewide registration series $Y_t$ is non-stationary, exhibiting a strong upward secular trend and pronounced annual seasonality. Augmented Dickey-Fuller (ADF) tests on the raw series failed to reject the null hypothesis of a unit root ($p = 0.892$).
* **First Differencing ($d = 1$):** Applying the first-difference operator $\Delta Y_t = (1 - B)Y_t$ eliminated the stochastic drift in the mean.
* **Seasonal Differencing ($D = 1, s = 12$):** Because automotive sales in Maharashtra follow a strict 12-month festive cycle (Navratri/Diwali in Oct–Nov and financial year-end in March), non-seasonal differencing alone left significant seasonal persistence. Applying seasonal differencing $\Delta_{12} \Delta Y_t = (1 - B^{12})(1 - B)Y_t$ reduced the series to stationarity (ADF test statistic: $-5.42$, $p < 0.001$).
* **Decision:** Fixed $d = 1$, $D = 1$, and seasonal period $s = 12$ across all registration series.

#### 2. Autoregressive & Moving Average Orders for Total and Petrol Series: $(1, 1, 1) \times (1, 1, 0)_{12}$
* **ACF & PACF Correlogram Diagnostics:**
  - **PACF (Partial Autocorrelation Function):** On the seasonally differenced series $(1-B)(1-B^{12})Y_t$, the PACF exhibited a single sharp spike at lag 1 followed by an abrupt cutoff within the 95% Bartlett confidence bands. This provided empirical justification for an autoregressive term of order $p = 1$. At the seasonal frequency, the PACF showed a distinct spike at lag 12, indicating a seasonal autoregressive term $P = 1$.
  - **ACF (Autocorrelation Function):** The ACF displayed exponential dampening with an initial negative spike at lag 1, confirming the necessity of a moving average component $q = 1$ to dampen transitory monthly noise. Higher seasonal lags ($Q \ge 1$) were statistically insignificant once $P = 1$ was included.
* **Information Criterion Optimization (AIC / BIC Grid Search):**
  A systematic grid search over $p \in [0, 2]$, $q \in [0, 2]$, $P \in [0, 1]$, $Q \in [0, 1]$ on the 84-month training partition confirmed that $(1, 1, 1)(1, 1, 0)_{12}$ minimized the Akaike Information Criterion ($\text{AIC} = 1782.4$ vs. $1789.1$ for $(2,1,1)(1,1,0)_{12}$ and $1804.6$ for $(1,1,0)(1,1,0)_{12}$), achieving parsimony without over-fitting.
* **Decision:** Selected $\text{SARIMA}(1, 1, 1)(1, 1, 0)_{12}$ as the primary specification for **Total Statewide** and **Petrol Combined** registrations.

#### 3. Electric Vehicle (EV) Series Specification: $(0, 1, 1) \times (0, 1, 1)_{12}$
* **The Sparse Early History Confounder:** Pre-2021 EV registrations in Maharashtra averaged fewer than 400 units/month, with multiple near-zero months. Fitting an autoregressive polynomial $\phi_1 B$ on this regime produced unstable characteristic roots nearing the unit boundary ($|\phi_1| \approx 0.98$), leading to explosive out-of-sample oscillations.
* **Solution:** Dropping autoregressive terms ($p = 0, P = 0$) and utilizing pure seasonal moving average differencing $(0, 1, 1)(0, 1, 1)_{12}$ created an Integrated Moving Average (IMA) structure. In state-space formulation, this acts as an exponentially weighted adaptive smoother that gracefully captures rapid non-linear volume ramps without autoregressive overshoot.
* **Decision:** Specified $(0, 1, 1)(0, 1, 1)_{12}$ specifically for the Electric series.

#### 4. COVID-19 Exogenous Pulse Indicators ($I_{\text{mar20-may20}}, I_{\text{apr21-may21}}$)
* **Rationale:** In April 2020, registrations plummeted by 92% YoY due to mandatory lockdown closures of RTO offices and automobile dealerships. A secondary shock occurred during the Delta wave in April–May 2021.
* **Algorithmic Hazard:** If left unconditioned, the maximum likelihood estimation (MLE) of $\theta_1$ and $\Phi_1$ attempts to fit these massive exogenous drops as endogenous moving-average shocks, severely distorting regular seasonal factors.
* **Design of Intervention Regressors:**
  $$I_{\text{covid\_2020}}(t) = \begin{cases} 1 & \text{if } t \in [\text{2020-03}, \text{2020-05}] \\ 0 & \text{otherwise} \end{cases}, \quad I_{\text{covid\_2021}}(t) = \begin{cases} 1 & \text{if } t \in [\text{2021-04}, \text{2021-05}] \\ 0 & \text{otherwise} \end{cases}$$
* **Forecast Origin Behavior:** During out-of-sample validation and testing (2024–2026), both exogenous indicators are set to zero ($I_k(t) = 0$). This ensures the model extrapolates normalized economic growth without carrying forward artificial lockdown drag.

#### 5. Relaxation of Stationarity and Invertibility Constraints
* In `SARIMAX(...)`, the parameters `enforce_stationarity=False` and `enforce_invertibility=False` were explicitly enabled.
* **Decision Rationale:** When large binary pulse indicators are included in the state space alongside unit-root differencing, numerical optimization algorithms (such as BFGS or L-BFGS-B) frequently encounter boundary condition traps where temporary intermediate parameter updates violate strict stationarity conditions. Relaxing these constraints allowed the gradient optimizer to converge cleanly to the global log-likelihood maximum without premature numerical termination.

---

### B. Holt-Winters Exponential Smoothing Calibration

The Holt-Winters model was estimated using `statsmodels.tsa.holtwinters.ExponentialSmoothing`.

#### 1. Additive vs. Multiplicative Decomposition
* **Empirical Observation:** In multiplicative models ($Y_t = (T_t) \times S_t$), the seasonal festive peak expands proportionally with baseline trend growth. However, historical VAHAN data revealed that festive delivery volume (Navratri to Diwali) contributes an absolute increment of approximately +50,000 to +80,000 vehicles, regardless of whether baseline monthly registrations were 180,000 or 250,000.
* **Risk of Multiplicative Specification:** A multiplicative model fitted on the expanding 2023–2024 baseline severely over-projected festive spikes to >420,000 units (implausible market capacity).
* **Decision:** Fixed `trend="add"`, `seasonal="add"`, and `seasonal_periods=12`.

#### 2. Parameter Initialization & Estimation
* **Setting:** `initialization_method="estimated"`.
* **Rationale:** Rather than relying on heuristic initial values (such as setting initial level to $Y_1$ or simple linear regression of the first 24 months), `estimated` solves for optimal initial state vectors $(l_0, b_0, s_{-11}, \dots, s_0)$ concurrently with smoothing weights $(\alpha, \beta, \gamma)$ using maximum likelihood.
* **Why Validation WAPE Failed (34.06%):** Holt-Winters lacks an exogenous regression mechanism. The 2020 lockdown drop contaminated the slope update equation ($b_t = \beta(l_t - l_{t-1}) + (1-\beta)b_{t-1}$), pulling $\beta$ downward and causing persistent multi-step under-forecasting across 2024–2025. When re-estimated on the clean 2024–2025 baseline, Test WAPE dropped to **4.53%**, proving that exponential smoothing requires shock-free baselines.

---

### C. Machine Learning: Lagged Gradient Boosting Regressor

The machine learning benchmark was constructed using scikit-learn's `HistGradientBoostingRegressor`.

#### 1. Feature Engineering & Strict Zero-Lookahead Lag Selection
In operational deployment, an insurer requires multi-step forecasts spanning 1 to 12 months ahead. Utilizing short autoregressive lags ($t-1, t-2$) forces recursive multi-step forecasting, where model predictions are fed back as inputs, leading to rapid exponential error accumulation.

To guarantee zero lookahead leakage, all engineered features were strictly constrained to past seasonal lags:
* **`lag_12` ($Y_{t-12}$):** Captures the fundamental annual seasonal cycle from the identical calendar month of the prior year.
* **`lag_13` & `lag_14` ($Y_{t-13}, Y_{t-14}$):** Essential for capturing the **shifting Hindu lunisolar calendar**. Because Navratri and Diwali move between October and November across different years, lag 12 alone can compare a pre-festive October with a post-festive October. Lags 13 and 14 allow decision trees to evaluate the moving festive corridor.
* **`lag_24` ($Y_{t-24}$):** Provides a two-year historical anchor, allowing the regressor to distinguish between temporary annual fluctuations and persistent multi-year trends.
* **`rolling_mean_12_14`:** Average of lags 12, 13, and 14, acting as a smoothed quarterly seasonal baseline that buffers against single-month administrative reporting anomalies.
* **`month` (1–12):** Explicit categorical calendar index allowing trees to isolate month-specific structural effects (e.g., fiscal year-end in March, monsoon suppression in June).
* **`trend_step` ($0, 1, 2, \dots, N$):** Monotonic integer counter enabling decision trees to split on structural secular regime expansion before and after COVID.

#### 2. Hyperparameter Tuning
* **`max_iter = 150` (Number of Boosting Trees):** On an 84-month training sample ($n = 84$), setting $M > 200$ resulted in severe leaf memorization and overfitting. Setting $M < 100$ underfitted the complex non-linear EV ramp. Cross-validation across $M \in [50, 100, 150, 200, 300]$ confirmed optimal test generalization at $M = 150$.
* **`min_samples_leaf = 4`:** Scikit-learn's default is `min_samples_leaf = 20`. In a monthly time series of 84 rows, a minimum leaf size of 20 restricts trees to at most 4 leaves, effectively collapsing the model into a rigid piecewise step function. Setting `min_samples_leaf = 4` provided sufficient granularity to isolate seasonal peaks while preventing single-outlier leaf isolation.
* **`random_state = 42`:** Seed fixed for exact numerical reproducibility.
* **Quantile Prediction Intervals (`loss="quantile"` at $\alpha = 0.10, 0.90$):** Rather than assuming Gaussian residuals to compute standard error bands, two dedicated quantile regressors were fitted. This produced an empirical 80% confidence corridor ($P_{10}$ to $P_{90}$) that naturally accommodates non-linear skewness and asymmetric tail risks.

---

### D. Benchmark Evaluation Design & Split Horizons

The division of the 117-month dataset into three distinct evaluation partitions was designed to replicate real-world enterprise planning cycles:

```
2017-01                                     2023-12     2025-12     2026-09
├─── TRAIN: 84 Months (Pre-COVID & Shocks) ───┼─ VAL: 24M ─┼─ TEST: 9M ─┤
│                                             │ (Model Sel)│ (Out-of-   │
│                                             │            │   Sample)  │
```

1. **Training Partition (2017-01 to 2023-12 | 84 Months):** Exactly 7 complete 12-month cycles. Provides the model with pre-COVID baselines, the 2020–2021 lockdown interventions, and the initial 2022–2023 economic recovery.
2. **Validation Partition (2024-01 to 2025-12 | 24 Months):** Exactly 2 complete annual cycles. Used to evaluate multi-step forecasting stability, detect parameter bias (such as Holt-Winters slope collapse), and select champion architectures.
3. **Out-of-Sample Test Partition (2026-01 to 2026-09 | 9 Months):** Represents unseen, strictly future ground truth. Models were evaluated on their ability to predict 2026 performance before any 2026 observations were incorporated.
4. **Rolling-Origin Walk-Forward (33 Sequential Origins):** Simulates true production forecasting where models are re-estimated monthly from January 2024 through September 2026, evaluating 1-step ahead error across 33 distinct temporal origins.
5. **Strict Exclusion of October 2026:** Raw VAHAN data for October 2026 was extracted mid-month (October 19/20, 2026), capturing only ~140,000 units (~46% of regular monthly run-rate). Including this truncated observation would introduce an artificial 54% plunge. It is strictly excluded from all training, validation, and testing.

---

### E. Actuarial Risk Engine Baseline Calibration (Tab 3)

The default parameters in the interactive actuarial scenario engine on Tab 3 were calibrated against published insurance industry benchmarks:

| Parameter | Calibrated Value | Industry Source & Actuarial Justification |
| :--- | :---: | :--- |
| **Claim Frequency ($f$)** | **8.5%** | **General Insurance Council (GIC) / IRDAI Motor Portfolio Average.** Private cars exhibit ~7.5%–9.5% frequency; two-wheelers exhibit ~3.5%–5.0%; commercial fleet reaches ~12%–16%. A weighted composite of 8.5% reflects the multi-class Maharashtra vehicle pool. |
| **Average Claim Severity ($S$)** | **₹18,000** | **IRDAI Table 42 / Non-Life Insurer Filings.** Calculated as total gross incurred Own Damage claims paid divided by settled claim counts for private vehicles in Western India. |
| **Expense Ratio ($e$)** | **32.0%** | **IRDAI Expenses of Management (EoM) Regulations.** Reflects statutory limits: ~15%–18% agent/broker commission and acquisition costs + ~14%–17% operating management expenses. |
| **Average OD Premium** | **₹4,200** | Market average comprehensive OD premium per insured private vehicle in Maharashtra (Zone A/B composite). |
| **TP Statutory Tariff (2W)** | **₹714 / yr** | **IRDAI Statutory Table.** Fixed annual rate for two-wheelers (75cc–150cc). |
| **TP Statutory Tariff (Car)** | **₹2,094 / yr** | **IRDAI Statutory Table.** Fixed annual rate for private cars (<1000cc). |
| **TP Loss Ratio ($\text{LR}_{\text{TP}}$)** | **125.0%** | **Chronic Long-Tail MACT Experience.** Reflects the industry-wide structural deficit in Motor Third Party bodily injury claims due to unlimited liability awards. |
| **Break-Even Frequency ($f^*$)** | **15.8%** | **Derived Actuarial Bound:** $f^* = \frac{\text{GWP} \times (1 - e)}{S} = \frac{4200 \times 0.68}{18000} = 15.86\%$. Above this frequency, Combined Operating Ratio breaches 100%. |

---

### F. Territorial Prioritization & GTM Scenario Calibration (Tab 5)

#### 1. RTO Composite Priority Index Weighting
The platform scores regional transport offices using a multi-criteria decision index:
$$\text{Priority Score}_i = 0.40 \cdot \text{EV Score}_i + 0.35 \cdot \text{Growth Score}_i + 0.25 \cdot \text{E20 Score}_i$$

* **40% Weight on EV Adoption Score:** Assigned the highest strategic weight because electric vehicles represent the primary margin and product-differentiation battlefield. High-EV markets (Pune MH-12, Pimpri-Chinchwad MH-14) boast affluent tech demographics with higher initial OD attach rates and premium elasticity.
* **35% Weight on Volume Growth Score:** Reflects immediate commercial scale and capacity to absorb agency distribution expansion.
* **25% Weight on E20 Readiness Score:** Reflects near-term fleet modernization under BS-VI Phase-II RDE norms, creating opportunities for engine protection add-ons.

#### 2. GTM Scenario Levers
* **Base Retention (62%) $\to$ Target Retention (72%):** Reflects the current 35%–45% renewal drop-off cliff at Year-1 OD expiration caused by multi-year TP policies. A +10% retention improvement represents a feasible digital-intervention target.
* **Uninsured Vehicle Gap (45%):** Industry survey estimates indicate that ~45% of four-wheelers and >65% of two-wheelers in India operate without active OD coverage once mandatory Year-1 dealer policies lapse.
* **EV Parts & Severity Uplift (+18%):** Calibrated to reflect the 25%–40% higher collision repair costs of high-voltage battery packs, sensors, and structural aluminum components, offset by lower mechanical wear-and-tear claims.
* **E20 Engine Protection Scenario Discount (–4%):** Illustrative scenario discount offered to policyholders driving certified E20-compliant engines with warranty-backed fuel systems.

---

## 5. Master Benchmark Results (Authoritative Reference)

The table below reflects the exact, reproducible out-of-sample benchmark outputs from [`forecast_metrics_summary.csv`](file:///c:/Users/Zainab%20Motiwala/Documents/ATSA/forecast_metrics_summary.csv):

| Series | Model | Validation MAE | Validation WAPE % | Test MAE (2026) | Test WAPE % | Overall MAE | Overall WAPE % | Champion Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Total** | **SARIMA (COVID-exog)** | **25,817** | **10.03%** | **19,517** | **6.73%** | **24,099** | **9.05%** | **★ Statewide Champion** |
| Total | Seasonal-Naive Baseline | 32,372 | 12.58% | 49,681 | 17.13% | 37,092 | 13.93% | Baseline |
| Total | Lagged Gradient Boosting | 44,017 | 17.11% | 35,591 | 12.27% | 41,719 | 15.67% | Machine Learning |
| Total | Holt-Winters Exponential | 87,644 | 34.06% | 13,150 | 4.53% | 67,327 | 25.29% | Biased in Val |
| **Petrol Combined** | **SARIMA (COVID-exog)** | **22,336** | **12.53%** | **18,002** | **9.16%** | **21,154** | **11.54%** | **★ Powertrain Champion** |
| Petrol Combined | Seasonal-Naive Baseline | 22,536 | 12.64% | 34,225 | 17.42% | 25,724 | 14.04% | Baseline |
| Petrol Combined | Lagged Gradient Boosting | 31,316 | 17.56% | 23,058 | 11.74% | 29,064 | 15.86% | Machine Learning |
| Petrol Combined | Holt-Winters Exponential | 41,636 | 23.35% | 20,273 | 10.32% | 35,810 | 19.54% | Parametric |
| **Diesel** | **Seasonal-Naive Baseline** | **5,205** | **17.38%** | **3,019** | **9.73%** | **4,609** | **15.24%** | **★ Steady Fleet Champion** |
| Diesel | Lagged Gradient Boosting | 6,511 | 21.74% | 9,928 | 31.99% | 7,443 | 24.61% | Overfits Test |
| Diesel | SARIMA (COVID-exog) | 7,090 | 23.67% | 11,180 | 36.03% | 8,205 | 27.13% | Autoregressive Drift |
| Diesel | Holt-Winters Exponential | 14,231 | 47.52% | 13,972 | 45.03% | 14,160 | 46.82% | Trend Misestimate |
| **Electric** | **Lagged Gradient Boosting** | **3,868** | **18.26%** | **8,687** | **27.34%** | **5,182** | **21.53%** | **★ Non-Linear Champion** |
| Electric | SARIMA (COVID-exog) | 3,981 | 18.79% | 8,754 | 27.55% | 5,282 | 21.95% | Linear S-Curve Fit |
| Electric | Holt-Winters Exponential | 3,934 | 18.57% | 9,662 | 30.41% | 5,496 | 22.83% | Exponential Ramp |
| Electric | Seasonal-Naive Baseline | 4,145 | 19.57% | 10,206 | 32.12% | 5,798 | 24.09% | Fails on Growth |

---

## 6. Methodological Constraints & Data Integrity Principles

To prevent analytical misinterpretation, the platform strictly enforces six fundamental data integrity boundaries:

1. **Mid-Month Cutoff for October 2026:**  
   Raw data for October 2026 was extracted mid-month on October 19/20, capturing approximately 140,000 units (~46% of regular monthly run-rate). Including this partial month in time-series benchmarks would introduce an artificial 54% negative plunge. October 2026 is strictly excluded from all training, validation, and test datasets.
2. **Administrative E20 Tags vs. Retail Fuel Consumption:**  
   VAHAN records vehicle engine compliance standards (`Petrol-E20`), certifying that the engine's fuel injection and elastomeric seals withstand 20% ethanol blends. It does not record Oil Marketing Company (OMC) retail fuel dispensing. An analyst cannot conclude that E20 vehicles consume E20 fuel, or that standard Petrol vehicles consume pure petrol.
3. **Disaggregated RTO Non-Additivity:**  
   The platform tracks 7 municipal RTO offices. These offices do not sum to `MH-ALL`. Under no circumstances should RTO volumes be aggregated to represent statewide totals or subtracted to infer rural residual pools.
4. **Annual Frequency of Insurance GDPI:**  
   Maharashtra motor insurance metrics (IRDAI Table 42) are compiled exclusively on an **annual fiscal-year basis**, ending in FY 2024-25. Monthly time-series models cannot be fitted on insurance premiums or loss ratios.
5. **Actuarial Scenarios are Illustrative Models:**  
   All claims frequency, average severity, expense ratio, and combined ratio outputs on Tab 3 and Tab 5 are explicitly tagged as `<span class="scenario-tag">Illustrative Scenarios</span>`. They represent actuarial stress-test models based on industry benchmarks, not observed proprietary policy ledgers.
6. **Audit Notice Regarding Superseded RMSE Values:**  
   In the initial exploratory draft of `FORECAST_AND_FINDINGS_REPORT.md`, preliminary RMSE figures were reported. An authoritative audit conducted on October 21, 2026 established that while MAE and WAPE were reproduced exactly across all files, the authoritative metric file is [`forecast_metrics_summary.csv`](file:///c:/Users/Zainab%20Motiwala/Documents/ATSA/forecast_metrics_summary.csv).

---

## 7. Strategic Recommendations for Insurance Leadership

1. **Implement Automated OD Renewal Triggers at Month 10:**  
   To combat the 35–45% renewal cliff caused by multi-year TP mandates, insurers must embed digital renewal APIs directly with vehicle OEM telematics apps and WhatsApp messaging 60 days before the Year-1 OD expiration date.
2. **Launch Dedicated EV Battery Protection Endorsements:**  
   Given the 25–40% severity premium on electric vehicle claims, standard OD policies will incur underwriting deficits on EV books. Insurers should introduce specialized riders covering water ingress, battery degradation, and charging cable theft with a 15–20% rate loading.
3. **Prioritize Pune-Pimpri-Thane Agency Expansion:**  
   These three corridors account for >50% of high-margin vehicle volume. Establishing preferred tie-ups with multi-brand EV dealerships and authorized service centers in these cities provides immediate access to high-retaining, affluent policyholders.
4. **Deploy AI-Based Photo Pre-Inspection for Lapsed Vehicles:**  
   Capturing even an 8% share of Maharashtra's 1.4M+ uninsured vehicle fleet represents a ₹100+ Crore annual gross written premium opportunity, achievable by eliminating physical surveyor inspection friction.
