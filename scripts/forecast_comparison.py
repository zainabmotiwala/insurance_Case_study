"""
ATSA: Model Comparison & Forecasting Pipeline for Maharashtra Vehicle Registrations
Models:
1. Seasonal-Naive Baseline
2. Holt-Winters Exponential Smoothing
3. SARIMA (with COVID-19 structural break exog indicators)
4. Lagged Gradient Boosting (HistGradientBoosting with strictly non-leaked lags)

Target Series:
- Total Statewide Registrations (Total)
- Petrol Combined (Petrol + Petrol-E20)
- Diesel
- Electric (Pure EV + Electric-BOV)

Evaluation Design:
- Train: 2017-01 to 2023-12 (84 months)
- Validation: 2024-01 to 2025-12 (24 months)
- Test: 2026-01 to 2026-09 (9 months)
- Rolling-Origin Backtesting across 2024-2026
"""

import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings("ignore")

import statsmodels.api as sm
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.stats.diagnostic import acorr_ljungbox
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

# Fix random seeds for reproducibility
np.random.seed(42)

DATA_FOLDER = r"C:\Users\Zainab Motiwala\Documents\ATSA"
os.chdir(DATA_FOLDER)
os.makedirs("reports", exist_ok=True)

print("=" * 80)
print("MAHARASHTRA MOTOR REGISTRATION FORECASTING BENCHMARK")
print("Evaluation: Train (2017-23) | Val (2024-25) | Test (2026 9M)")
print("=" * 80)

# -----------------------------------------------------------------------------
# 1. Load Data & Prepare Target Series
# -----------------------------------------------------------------------------
df = pd.read_csv(os.path.join(DATA_FOLDER, "data", "clean", "registrations_maharashtra_monthly.csv"), dtype={"month_id": str})
df["date"] = pd.to_datetime(df["date"])

# Build target time-series
series_dict = {}

# 1. Total Statewide Registrations
series_dict["Total"] = df.groupby("date")["count"].sum().sort_index()

# 2. Petrol Combined (Petrol + Petrol-E20)
petrol_df = df[df["fuel_group"].isin(["Petrol", "Petrol-E20"])]
series_dict["Petrol_Combined"] = petrol_df.groupby("date")["count"].sum().reindex(series_dict["Total"].index, fill_value=0)

# 3. Diesel
diesel_df = df[df["fuel_group"] == "Diesel"]
series_dict["Diesel"] = diesel_df.groupby("date")["count"].sum().reindex(series_dict["Total"].index, fill_value=0)

# 4. Electric (Pure EV + Electric-BOV)
ev_df = df[df["fuel_group"].isin(["Pure EV", "Electric-BOV"])]
series_dict["Electric"] = ev_df.groupby("date")["count"].sum().reindex(series_dict["Total"].index, fill_value=0)

dates = series_dict["Total"].index

# Exogenous COVID indicators (March-May 2020 national lockdown, May 2021 Delta wave)
exog_df = pd.DataFrame(index=dates)
exog_df["covid_2020"] = ((exog_df.index >= "2020-03-01") & (exog_df.index <= "2020-05-01")).astype(int)
exog_df["covid_2021"] = ((exog_df.index >= "2021-04-01") & (exog_df.index <= "2021-05-01")).astype(int)

# Split boundaries
train_mask = dates <= "2023-12-01"
val_mask = (dates >= "2024-01-01") & (dates <= "2025-12-01")
test_mask = dates >= "2026-01-01"

train_dates = dates[train_mask]
val_dates = dates[val_mask]
test_dates = dates[test_mask]
eval_dates = dates[val_mask | test_mask]

print(f"Dataset Dates: {dates.min().strftime('%Y-%m')} to {dates.max().strftime('%Y-%m')} ({len(dates)} months)")
print(f"  Training:   {train_dates.min().strftime('%Y-%m')} to {train_dates.max().strftime('%Y-%m')} ({len(train_dates)} months)")
print(f"  Validation: {val_dates.min().strftime('%Y-%m')} to {val_dates.max().strftime('%Y-%m')} ({len(val_dates)} months)")
print(f"  Testing:    {test_dates.min().strftime('%Y-%m')} to {test_dates.max().strftime('%Y-%m')} ({len(test_dates)} months)")

# -----------------------------------------------------------------------------
# 2. Forecasting Functions
# -----------------------------------------------------------------------------
def run_models_for_series(s_name, y_series):
    y_train = y_series.loc[train_dates]
    y_val = y_series.loc[val_dates]
    y_test = y_series.loc[test_dates]
    y_eval = y_series.loc[eval_dates]

    # --- MODEL 1: Seasonal Naive (lag 12) ---
    # Forecast at t is the observed value at t-12
    snaive_val = y_series.shift(12).loc[val_dates].values
    snaive_test = y_series.shift(12).loc[test_dates].values
    snaive_eval = np.concatenate([snaive_val, snaive_test])

    # --- MODEL 2: Holt-Winters Exponential Smoothing ---
    # Multi-step ahead forecast from training origin
    try:
        hw_model = ExponentialSmoothing(
            y_train, trend="add", seasonal="add", seasonal_periods=12, initialization_method="estimated"
        ).fit()
        hw_val = hw_model.forecast(len(val_dates)).values
        # test forecast continues from end of val
        hw_full_model = ExponentialSmoothing(
            y_series.loc[dates <= "2025-12-01"], trend="add", seasonal="add", seasonal_periods=12, initialization_method="estimated"
        ).fit()
        hw_test = hw_full_model.forecast(len(test_dates)).values
        hw_eval = np.concatenate([hw_val, hw_test])
    except Exception as e:
        print(f"HW error for {s_name}: {e}")
        hw_val = np.full(len(val_dates), np.nan)
        hw_test = np.full(len(test_dates), np.nan)
        hw_eval = np.full(len(eval_dates), np.nan)

    # --- MODEL 3: SARIMA with COVID-19 Exogenous Indicators ---
    # Isolates structural disruption during 2020-2021 without deleting rows
    try:
        sarima_order = (1, 1, 1)
        sarima_s_order = (1, 1, 0, 12)
        if s_name == "Electric":
            # EV series has near-zero early history; specify stable (0,1,1)(0,1,1,12)
            sarima_order = (0, 1, 1)
            sarima_s_order = (0, 1, 1, 12)

        sarima_model = SARIMAX(
            y_train,
            order=sarima_order,
            seasonal_order=sarima_s_order,
            exog=exog_df.loc[train_dates],
            enforce_stationarity=False,
            enforce_invertibility=False
        ).fit(disp=False)

        # Forecast validation (exog is 0 for post-2023)
        val_res = sarima_model.get_forecast(steps=len(val_dates), exog=exog_df.loc[val_dates])
        sarima_val = val_res.predicted_mean.values
        sarima_val_ci = val_res.conf_int(alpha=0.20).values # 80% CI

        # Refit with validation data to forecast test period
        sarima_full = SARIMAX(
            y_series.loc[dates <= "2025-12-01"],
            order=sarima_order,
            seasonal_order=sarima_s_order,
            exog=exog_df.loc[dates <= "2025-12-01"],
            enforce_stationarity=False,
            enforce_invertibility=False
        ).fit(disp=False)
        test_res = sarima_full.get_forecast(steps=len(test_dates), exog=exog_df.loc[test_dates])
        sarima_test = test_res.predicted_mean.values
        sarima_test_ci = test_res.conf_int(alpha=0.20).values

        sarima_eval = np.concatenate([sarima_val, sarima_test])
        sarima_ci_lower = np.concatenate([sarima_val_ci[:, 0], sarima_test_ci[:, 0]])
        sarima_ci_upper = np.concatenate([sarima_val_ci[:, 1], sarima_test_ci[:, 1]])
    except Exception as e:
        print(f"SARIMA error for {s_name}: {e}")
        sarima_val = np.full(len(val_dates), np.nan)
        sarima_test = np.full(len(test_dates), np.nan)
        sarima_eval = np.full(len(eval_dates), np.nan)
        sarima_ci_lower = sarima_eval.copy()
        sarima_ci_upper = sarima_eval.copy()

    # --- MODEL 4: Lagged Gradient Boosting (Zero Future Leakage) ---
    # Construct strictly past features: lag 12, lag 13, lag 14, lag 24, rolling statistics
    feat_df = pd.DataFrame(index=dates)
    feat_df["target"] = y_series.values
    feat_df["month"] = feat_df.index.month
    feat_df["trend_step"] = np.arange(len(feat_df))
    feat_df["covid_2020"] = exog_df["covid_2020"].values
    feat_df["covid_2021"] = exog_df["covid_2021"].values

    for lag in [12, 13, 14, 24]:
        feat_df[f"lag_{lag}"] = feat_df["target"].shift(lag)
    feat_df["rolling_mean_12_14"] = feat_df[["lag_12", "lag_13", "lag_14"]].mean(axis=1)

    # Training features
    feature_cols = [c for c in feat_df.columns if c != "target"]
    valid_feat_df = feat_df.dropna()

    X_tr = valid_feat_df.loc[valid_feat_df.index <= "2023-12-01", feature_cols]
    y_tr = valid_feat_df.loc[valid_feat_df.index <= "2023-12-01", "target"]

    gb_point = HistGradientBoostingRegressor(random_state=42, max_iter=150, min_samples_leaf=4).fit(X_tr, y_tr)
    gb_q10 = HistGradientBoostingRegressor(loss="quantile", quantile=0.10, random_state=42, max_iter=150, min_samples_leaf=4).fit(X_tr, y_tr)
    gb_q90 = HistGradientBoostingRegressor(loss="quantile", quantile=0.90, random_state=42, max_iter=150, min_samples_leaf=4).fit(X_tr, y_tr)

    # Val predictions
    X_v = feat_df.loc[val_dates, feature_cols]
    gb_val = gb_point.predict(X_v)

    # Update model with val data to predict test
    X_tr_full = valid_feat_df.loc[valid_feat_df.index <= "2025-12-01", feature_cols]
    y_tr_full = valid_feat_df.loc[valid_feat_df.index <= "2025-12-01", "target"]
    gb_point_full = HistGradientBoostingRegressor(random_state=42, max_iter=150, min_samples_leaf=4).fit(X_tr_full, y_tr_full)
    gb_q10_full = HistGradientBoostingRegressor(loss="quantile", quantile=0.10, random_state=42, max_iter=150, min_samples_leaf=4).fit(X_tr_full, y_tr_full)
    gb_q90_full = HistGradientBoostingRegressor(loss="quantile", quantile=0.90, random_state=42, max_iter=150, min_samples_leaf=4).fit(X_tr_full, y_tr_full)

    X_te = feat_df.loc[test_dates, feature_cols]
    gb_test = gb_point_full.predict(X_te)
    gb_eval = np.concatenate([gb_val, gb_test])

    gb_lower = np.concatenate([gb_q10.predict(X_v), gb_q10_full.predict(X_te)])
    gb_upper = np.concatenate([gb_q90.predict(X_v), gb_q90_full.predict(X_te)])

    return {
        "actual_eval": y_eval.values,
        "actual_val": y_val.values,
        "actual_test": y_test.values,
        "snaive_val": snaive_val, "snaive_test": snaive_test, "snaive_eval": snaive_eval,
        "hw_val": hw_val, "hw_test": hw_test, "hw_eval": hw_eval,
        "sarima_val": sarima_val, "sarima_test": sarima_test, "sarima_eval": sarima_eval,
        "sarima_ci_lower": sarima_ci_lower, "sarima_ci_upper": sarima_ci_upper,
        "gb_val": gb_val, "gb_test": gb_test, "gb_eval": gb_eval,
        "gb_ci_lower": gb_lower, "gb_ci_upper": gb_upper,
    }

# Run all series
results = {}
for s_name, y_s in series_dict.items():
    print(f"\nTraining and forecasting models for: {s_name}...")
    results[s_name] = run_models_for_series(s_name, y_s)

# -----------------------------------------------------------------------------
# 3. Compute Metrics (MAE, RMSE, WAPE)
# -----------------------------------------------------------------------------
def calc_metrics(y_true, y_pred):
    mask = ~np.isnan(y_pred)
    yt, yp = y_true[mask], y_pred[mask]
    mae = mean_absolute_error(yt, yp)
    rmse = np.sqrt(mean_squared_error(yt, yp))
    wape = (np.sum(np.abs(yt - yp)) / np.sum(yt)) * 100
    return mae, rmse, wape

metric_rows = []
models = [
    ("Seasonal Naive", "snaive"),
    ("Holt-Winters", "hw"),
    ("SARIMA (COVID-exog)", "sarima"),
    ("Lagged Grad-Boost", "gb")
]

for s_name, res in results.items():
    for m_label, m_key in models:
        # Validation period metrics
        v_mae, v_rmse, v_wape = calc_metrics(res["actual_val"], res[f"{m_key}_val"])
        # Test period metrics
        t_mae, t_rmse, t_wape = calc_metrics(res["actual_test"], res[f"{m_key}_test"])
        # Combined out-of-sample metrics (2024-2026 9M)
        c_mae, c_rmse, c_wape = calc_metrics(res["actual_eval"], res[f"{m_key}_eval"])

        metric_rows.append({
            "Series": s_name,
            "Model": m_label,
            "Val_MAE": round(v_mae, 1),
            "Val_RMSE": round(v_rmse, 1),
            "Val_WAPE_%": round(v_wape, 2),
            "Test_MAE": round(t_mae, 1),
            "Test_RMSE": round(t_rmse, 1),
            "Test_WAPE_%": round(t_wape, 2),
            "Overall_MAE": round(c_mae, 1),
            "Overall_RMSE": round(c_rmse, 1),
            "Overall_WAPE_%": round(c_wape, 2)
        })

metrics_df = pd.DataFrame(metric_rows)
metrics_df.to_csv(os.path.join("reports", "forecast_metrics_summary.csv"), index=False)

print("\n" + "="*80)
print("FORECASTING PERFORMANCE SUMMARY (MAE, RMSE, WAPE %)")
print("="*80)
print(metrics_df[["Series", "Model", "Val_MAE", "Val_WAPE_%", "Test_MAE", "Test_WAPE_%", "Overall_MAE", "Overall_WAPE_%"]].to_string(index=False))

# -----------------------------------------------------------------------------
# 4. Rolling-Origin Backtesting Evaluation
# -----------------------------------------------------------------------------
print("\n[SECTION] ROLLING-ORIGIN BACKTESTING (1-Month Ahead Walk-Forward)")
print("-" * 60)
rolling_records = []
eval_points = [d for d in dates if d >= pd.to_datetime("2024-01-01")]

# Run rolling 1-step forecast for Total Registrations
tot_series = series_dict["Total"]
for origin_date in eval_points:
    # Training window strictly before origin_date
    y_sub = tot_series.loc[:origin_date].iloc[:-1] # strictly past
    actual_val = tot_series.loc[origin_date]

    # S-Naive
    snaive_p = tot_series.shift(12).loc[origin_date]

    # SARIMA
    try:
        sub_exog = exog_df.loc[y_sub.index]
        cur_exog = exog_df.loc[[origin_date]]
        sarima_roll = SARIMAX(y_sub, order=(1,1,1), seasonal_order=(1,1,0,12), exog=sub_exog,
                              enforce_stationarity=False, enforce_invertibility=False).fit(disp=False)
        sarima_p = sarima_roll.forecast(steps=1, exog=cur_exog).values[0]
    except:
        sarima_p = np.nan

    rolling_records.append({
        "Date": origin_date,
        "Actual": actual_val,
        "SNaive_Pred": snaive_p,
        "SARIMA_Pred": sarima_p
    })

roll_df = pd.DataFrame(rolling_records)
roll_df["SNaive_Err"] = np.abs(roll_df["Actual"] - roll_df["SNaive_Pred"])
roll_df["SARIMA_Err"] = np.abs(roll_df["Actual"] - roll_df["SARIMA_Pred"])
roll_df.to_csv(os.path.join("reports", "rolling_origin_metrics.csv"), index=False)

print(f"Rolling-Origin 1-Step Average MAE across {len(roll_df)} walk-forward origins:")
print(f"  Seasonal-Naive MAE: {roll_df['SNaive_Err'].mean():,.1f} (WAPE: {(roll_df['SNaive_Err'].sum()/roll_df['Actual'].sum())*100:.2f}%)")
print(f"  SARIMA (Exog) MAE:  {roll_df['SARIMA_Err'].mean():,.1f} (WAPE: {(roll_df['SARIMA_Err'].sum()/roll_df['Actual'].sum())*100:.2f}%)")

# -----------------------------------------------------------------------------
# 5. Residual Diagnostics (Ljung-Box & Normality)
# -----------------------------------------------------------------------------
print("\n[SECTION] RESIDUAL DIAGNOSTICS FOR TOTAL REGISTRATIONS")
print("-" * 60)
sarima_tot_res = results["Total"]["actual_eval"] - results["Total"]["sarima_eval"]
lb_test = acorr_ljungbox(sarima_tot_res, lags=[6, 12], return_df=True)
print("Ljung-Box Autocorrelation Test on SARIMA Forecast Residuals:")
print(lb_test)

# -----------------------------------------------------------------------------
# 6. Generate and Save Comparison Plots
# -----------------------------------------------------------------------------
print("\nGenerating and saving comparison visualization plots...")

# PLOT 1: Total Registrations Forecast Comparison with Prediction Intervals
fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(14, 10), sharex=True)

# Actuals
ax1.plot(dates, series_dict["Total"].values, color="black", lw=2, label="Actual Observed")
ax1.plot(eval_dates, results["Total"]["snaive_eval"], "--", color="gray", label="Seasonal-Naive Baseline")
ax1.plot(eval_dates, results["Total"]["hw_eval"], "-.", color="orange", label="Holt-Winters")
ax1.plot(eval_dates, results["Total"]["sarima_eval"], "-", color="blue", lw=2, label="SARIMA (COVID-exog)")
ax1.fill_between(eval_dates, results["Total"]["sarima_ci_lower"], results["Total"]["sarima_ci_upper"], color="blue", alpha=0.15, label="SARIMA 80% CI")
ax1.plot(eval_dates, results["Total"]["gb_eval"], ":", color="green", lw=2, label="Lagged Gradient Boosting")

ax1.axvline(pd.to_datetime("2024-01-01"), color="red", linestyle=":", label="Validation Split (2024)")
ax1.axvline(pd.to_datetime("2026-01-01"), color="purple", linestyle=":", label="Test Split (2026)")
ax1.set_title("Maharashtra Statewide Vehicle Registrations: Model Forecast Comparison (2017–2026)", fontsize=13, fontweight="bold")
ax1.set_ylabel("Monthly Registrations")
ax1.grid(True, alpha=0.3)
ax1.legend(loc="upper left", framealpha=0.9, fontsize=9)

# Forecast Absolute Errors
ax2.plot(eval_dates, np.abs(results["Total"]["actual_eval"] - results["Total"]["snaive_eval"]), "--", color="gray", label="S-Naive Absolute Error")
ax2.plot(eval_dates, np.abs(results["Total"]["actual_eval"] - results["Total"]["hw_eval"]), "-.", color="orange", label="Holt-Winters Absolute Error")
ax2.plot(eval_dates, np.abs(results["Total"]["actual_eval"] - results["Total"]["sarima_eval"]), "-", color="blue", lw=2, label="SARIMA Absolute Error")
ax2.plot(eval_dates, np.abs(results["Total"]["actual_eval"] - results["Total"]["gb_eval"]), ":", color="green", lw=2, label="Gradient Boosting Absolute Error")
ax2.axvline(pd.to_datetime("2024-01-01"), color="red", linestyle=":")
ax2.axvline(pd.to_datetime("2026-01-01"), color="purple", linestyle=":")
ax2.set_title("Out-of-Sample Absolute Forecast Errors (|Actual - Forecast|)", fontsize=12)
ax2.set_ylabel("Absolute Error (Units)")
ax2.set_xlabel("Date")
ax2.grid(True, alpha=0.3)
ax2.legend(loc="upper left", framealpha=0.9, fontsize=9)

plt.tight_layout()
plt.savefig(os.path.join("reports", "forecast_comparison_total.png"), dpi=150)
plt.close()
print("  [OK] Saved forecast_comparison_total.png")

# PLOT 2: Fuel Groups Multi-panel Forecast Comparison
fig, axes = plt.subplots(3, 1, figsize=(14, 12), sharex=True)
fuel_plots = [
    ("Petrol_Combined", "Petrol Combined (Standard Petrol + Petrol-E20)", axes[0]),
    ("Diesel", "Diesel Statewide Registrations", axes[1]),
    ("Electric", "Electric Vehicles (Pure EV + Electric-BOV)", axes[2])
]

for s_key, s_title, ax in fuel_plots:
    res = results[s_key]
    ax.plot(dates, series_dict[s_key].values, color="black", lw=1.8, label="Actual Observed")
    ax.plot(eval_dates, res["snaive_eval"], "--", color="gray", label="S-Naive")
    ax.plot(eval_dates, res["hw_eval"], "-.", color="orange", label="Holt-Winters")
    ax.plot(eval_dates, res["sarima_eval"], "-", color="blue", lw=1.8, label="SARIMA")
    ax.plot(eval_dates, res["gb_eval"], ":", color="green", lw=1.8, label="Gradient Boosting")
    ax.axvline(pd.to_datetime("2024-01-01"), color="red", linestyle=":", alpha=0.7)
    ax.axvline(pd.to_datetime("2026-01-01"), color="purple", linestyle=":", alpha=0.7)
    ax.set_title(s_title, fontsize=11, fontweight="bold")
    ax.set_ylabel("Registrations")
    ax.grid(True, alpha=0.3)
    ax.legend(loc="upper left", fontsize=8, framealpha=0.9)

axes[2].set_xlabel("Date")
plt.tight_layout()
plt.savefig(os.path.join("reports", "forecast_comparison_fuel_groups.png"), dpi=150)
plt.close()
print("  [OK] Saved forecast_comparison_fuel_groups.png")

# PLOT 3: Residual Diagnostics for SARIMA & Gradient Boosting
fig, axes = plt.subplots(2, 2, figsize=(13, 9))

# SARIMA Residuals
sar_res = results["Total"]["actual_eval"] - results["Total"]["sarima_eval"]
gb_res = results["Total"]["actual_eval"] - results["Total"]["gb_eval"]

axes[0, 0].plot(eval_dates, sar_res, marker="o", color="blue")
axes[0, 0].axhline(0, color="red", linestyle="--")
axes[0, 0].set_title("SARIMA Forecast Residuals over Time", fontsize=11, fontweight="bold")
axes[0, 0].set_ylabel("Residual (Actual - Predicted)")
axes[0, 0].grid(True, alpha=0.3)

sm.qqplot(sar_res, line="s", ax=axes[0, 1], markerfacecolor="blue", alpha=0.7)
axes[0, 1].set_title("SARIMA Residuals Q-Q Plot", fontsize=11, fontweight="bold")
axes[0, 1].grid(True, alpha=0.3)

axes[1, 0].plot(eval_dates, gb_res, marker="s", color="green")
axes[1, 0].axhline(0, color="red", linestyle="--")
axes[1, 0].set_title("Gradient Boosting Residuals over Time", fontsize=11, fontweight="bold")
axes[1, 0].set_ylabel("Residual (Actual - Predicted)")
axes[1, 0].grid(True, alpha=0.3)

sm.qqplot(gb_res, line="s", ax=axes[1, 1], markerfacecolor="green", alpha=0.7)
axes[1, 1].set_title("Gradient Boosting Residuals Q-Q Plot", fontsize=11, fontweight="bold")
axes[1, 1].grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig(os.path.join("reports", "residual_diagnostics.png"), dpi=150)
plt.close()
print("  [OK] Saved residual_diagnostics.png")

# PLOT 4: Rolling-Origin Walk-Forward Performance
fig, ax = plt.subplots(figsize=(12, 5))
ax.plot(roll_df["Date"], roll_df["Actual"], "k-o", label="Actual Registrations")
ax.plot(roll_df["Date"], roll_df["SNaive_Pred"], "--", color="gray", label="Seasonal-Naive 1-Step")
ax.plot(roll_df["Date"], roll_df["SARIMA_Pred"], "-", color="blue", lw=2, label="SARIMA (COVID-exog) 1-Step")
ax.set_title("Rolling-Origin 1-Step Ahead Out-of-Sample Performance (2024–2026)", fontsize=12, fontweight="bold")
ax.set_ylabel("Monthly Registrations")
ax.grid(True, alpha=0.3)
ax.legend(loc="upper left", framealpha=0.9)
plt.tight_layout()
plt.savefig(os.path.join("reports", "rolling_origin_performance.png"), dpi=150)
plt.close()
print("  [OK] Saved rolling_origin_performance.png")

print("\nForecasting benchmark completed successfully.")
