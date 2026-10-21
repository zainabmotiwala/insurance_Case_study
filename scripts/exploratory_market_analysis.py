"""
ATSA: Exploratory Market Analysis for Maharashtra Statewide Registrations
Performs:
1. Monthly statewide registration trends & descriptive statistics.
2. Year-on-Year (YoY) growth rates across time windows.
3. Fuel-group volumes and evolving market shares.
4. E20-labelled registration trajectory & petrol fleet penetration.
5. Electrified vehicle trends (EV and Hybrid) with formal category definitions.
6. Stationarity tests (ADF and KPSS) on levels, first differences, and seasonal differences.
7. Seasonal decomposition (additive & multiplicative) and structural-break diagnostics.
8. Comprehensive summary of data limitations, category evolution, and missing value checks.
"""

import os
import pandas as pd
import numpy as np
import statsmodels.api as sm
from statsmodels.tsa.stattools import adfuller, kpss
from statsmodels.tsa.seasonal import seasonal_decompose
import warnings
warnings.filterwarnings("ignore")

DATA_FOLDER = r"C:\Users\Zainab Motiwala\Documents\ATSA"
os.chdir(DATA_FOLDER)
os.makedirs("reports", exist_ok=True)

# Load the analytical dataset
df = pd.read_csv(os.path.join(DATA_FOLDER, "data", "clean", "registrations_maharashtra_monthly.csv"), dtype={"month_id": str})
df["date"] = pd.to_datetime(df["date"])

print("=" * 80)
print("EXPLORATORY MARKET ANALYSIS: MAHARASHTRA STATEWIDE REGISTRATIONS (2017 - 2026)")
print("=" * 80)

# -----------------------------------------------------------------------------
# 1. Total Monthly Registrations & Descriptive Stats
# -----------------------------------------------------------------------------
monthly_tot = df.groupby(["month_id", "date", "reporting_window"], as_index=False)["count"].sum().sort_values("date").reset_index(drop=True)
monthly_tot["yoy_growth"] = monthly_tot["count"].pct_change(12) * 100

print("\n[SECTION 1] DESCRIPTIVE STATISTICS ACROSS TIME WINDOWS")
print("-" * 60)
stats_full = monthly_tot["count"].describe()
stats_hist = monthly_tot[monthly_tot["reporting_window"] == "historical_training"]["count"].describe()
stats_prim = monthly_tot[monthly_tot["reporting_window"] == "primary_reporting"]["count"].describe()

summary_stats = pd.DataFrame({
    "Full Series (2017-26)": stats_full,
    "Historical (2017-18)": stats_hist,
    "Primary (2019-26)": stats_prim
})
print(summary_stats.round(1))

# Annual sums for Maharashtra
annual_sums = monthly_tot.copy()
annual_sums["year"] = annual_sums["date"].dt.year
print("\nAnnual Total Statewide Registrations:")
print(annual_sums.groupby("year")["count"].agg(["sum", "count"]).rename(columns={"sum": "Total_Registrations", "count": "Months_Count"}))

# -----------------------------------------------------------------------------
# 2. Fuel-Group Aggregation & Market Shares
# -----------------------------------------------------------------------------
# We map fuels into primary analytical groups:
def categorize_macro_fuel(fg):
    if fg == "Petrol": return "Petrol (Standard)"
    elif fg == "Petrol-E20": return "Petrol-E20"
    elif fg in ["Petrol-CNG", "Petrol-E20-CNG", "CNG"]: return "CNG & Bi-Fuel"
    elif fg in ["Diesel"]: return "Diesel"
    elif fg in ["Diesel-Hybrid"]: return "Diesel-Hybrid"
    elif fg in ["Electric-BOV", "Pure EV"]: return "Electric (Pure EV + BOV)"
    elif fg in ["Strong Hybrid EV", "Petrol-Hybrid", "Petrol-E20-Hybrid", "PHEV"]: return "Hybrid (Petrol/PHEV/SHEV)"
    else: return "Other (LPG/Ethanol/Solar/NA)"

df["macro_fuel"] = df["fuel_group"].apply(categorize_macro_fuel)

# Monthly pivot of macro fuels
fuel_piv = df.pivot_table(index="date", columns="macro_fuel", values="count", aggfunc="sum", fill_value=0)
fuel_share = fuel_piv.div(fuel_piv.sum(axis=1), axis=0) * 100

print("\n[SECTION 2] FUEL-GROUP VOLUMES & MARKET SHARES")
print("-" * 60)
print("\nAverage Market Share by Period (%):")
fuel_share_period = fuel_share.copy()
fuel_share_period["window"] = np.where(fuel_share_period.index < "2019-01-01", "2017-2018 (Historical)",
                               np.where(fuel_share_period.index < "2023-01-01", "2019-2022 (Pre-E20)", "2023-2026 (Post-E20 Rollout)"))
print(fuel_share_period.groupby("window").mean().round(2).T)

# -----------------------------------------------------------------------------
# 3. E20-Labelled Registration Trends & Petrol Fleet Penetration
# -----------------------------------------------------------------------------
print("\n[SECTION 3] E20 REGISTRATION TRAJECTORY & PETROL FLEET PENETRATION")
print("-" * 60)
# All petrol-compatible: Petrol (Standard) + Petrol-E20
petrol_tot = fuel_piv["Petrol (Standard)"] + fuel_piv["Petrol-E20"]
e20_penetration = (fuel_piv["Petrol-E20"] / petrol_tot) * 100

e20_analysis = pd.DataFrame({
    "Petrol_Standard": fuel_piv["Petrol (Standard)"],
    "Petrol_E20": fuel_piv["Petrol-E20"],
    "Total_Petrol_Pure": petrol_tot,
    "E20_Share_in_Petrol_%": e20_penetration
})

print("Recent E20 Scaling Trajectory (Quarterly Averages / Year End):")
e20_recent = e20_analysis.loc["2023-01-01":"2026-09-01"].copy()
print(e20_recent.resample("QE").agg({
    "Petrol_Standard": "sum",
    "Petrol_E20": "sum",
    "Total_Petrol_Pure": "sum"
}).assign(E20_Penetration_Pct=lambda x: (x["Petrol_E20"]/x["Total_Petrol_Pure"])*100).round(2))

# -----------------------------------------------------------------------------
# 4. Electric & Hybrid Trends with Formal Definitions
# -----------------------------------------------------------------------------
print("\n[SECTION 4] ELECTRIC & HYBRID TRENDS (DETAILED CATEGORIES)")
print("-" * 60)
ev_detailed = df[df["fuel_group"].isin([
    "Electric-BOV", "Pure EV", "PHEV", "Strong Hybrid EV", "Petrol-Hybrid", "Petrol-E20-Hybrid", "Diesel-Hybrid"
])].pivot_table(index="date", columns="fuel_group", values="count", aggfunc="sum", fill_value=0)

print("Annual Electrified Vehicle Totals (Units):")
print(ev_detailed.resample("YE").sum().T)

# -----------------------------------------------------------------------------
# 5. Stationarity Tests (ADF and KPSS)
# -----------------------------------------------------------------------------
print("\n[SECTION 5] STATIONARITY TESTS (ADF & KPSS)")
print("-" * 60)

series_dict = {
    "Total Registrations (Levels)": monthly_tot.set_index("date")["count"],
    "Total Registrations (First Difference)": monthly_tot.set_index("date")["count"].diff().dropna(),
    "Total Registrations (Seasonal Diff: 12m)": monthly_tot.set_index("date")["count"].diff(12).dropna(),
    "Petrol Standard (Levels)": fuel_piv["Petrol (Standard)"],
    "Petrol Standard (First Difference)": fuel_piv["Petrol (Standard)"].diff().dropna(),
    "Diesel (Levels)": fuel_piv["Diesel"],
    "Diesel (First Difference)": fuel_piv["Diesel"].diff().dropna(),
    "Electric BOV + Pure EV (Levels)": fuel_piv["Electric (Pure EV + BOV)"],
    "Electric BOV + Pure EV (First Difference)": fuel_piv["Electric (Pure EV + BOV)"].diff().dropna()
}

stationarity_results = []
for name, s in series_dict.items():
    # ADF test
    adf_res = adfuller(s, autolag="AIC")
    adf_stat = adf_res[0]
    adf_p = adf_res[1]
    adf_crit5 = adf_res[4]["5%"]
    adf_stationary = "Stationary (p<0.05)" if adf_p < 0.05 else "Non-Stationary"

    # KPSS test
    kpss_res = kpss(s, regression="c", nlags="auto")
    kpss_stat = kpss_res[0]
    kpss_p = kpss_res[1]
    kpss_crit5 = kpss_res[3]["5%"]
    kpss_stationary = "Stationary (p>0.05)" if kpss_p >= 0.05 else "Non-Stationary"

    stationarity_results.append({
        "Series": name,
        "ADF_Stat": round(adf_stat, 3),
        "ADF_p": round(adf_p, 4),
        "ADF_5%_Crit": round(adf_crit5, 3),
        "ADF_Result": adf_stationary,
        "KPSS_Stat": round(kpss_stat, 3),
        "KPSS_p": round(kpss_p, 4),
        "KPSS_5%_Crit": round(kpss_crit5, 3),
        "KPSS_Result": kpss_stationary
    })

stat_df = pd.DataFrame(stationarity_results)
print(stat_df[["Series", "ADF_Stat", "ADF_p", "ADF_Result", "KPSS_Stat", "KPSS_p", "KPSS_Result"]].to_string(index=False))

# -----------------------------------------------------------------------------
# 6. Seasonal Decomposition & Structural Breaks
# -----------------------------------------------------------------------------
print("\n[SECTION 6] SEASONAL DECOMPOSITION & STRUCTURAL BREAKS")
print("-" * 60)
decomp_add = seasonal_decompose(monthly_tot.set_index("date")["count"], model="additive", period=12)
monthly_tot["trend_add"] = decomp_add.trend.values
monthly_tot["seasonal_add"] = decomp_add.seasonal.values
monthly_tot["resid_add"] = decomp_add.resid.values

monthly_tot["month_name"] = monthly_tot["date"].dt.strftime("%b")
month_order = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
seasonal_pattern = monthly_tot.groupby("month_name")["seasonal_add"].mean().reindex(month_order)
print("Monthly Seasonal Factors (Additive impact on vehicle count relative to trend):")
for m, val in seasonal_pattern.items():
    print(f"  {m:4s}: {val:+10,.0f} units")

# Structural breaks: Identify outliers and COVID shock
monthly_tot["std_resid"] = (monthly_tot["resid_add"] - monthly_tot["resid_add"].mean()) / monthly_tot["resid_add"].std()
extreme_residuals = monthly_tot[monthly_tot["std_resid"].abs() > 2.5][["month_id", "date", "count", "trend_add", "seasonal_add", "resid_add", "std_resid"]]
print("\nStructural Breaks & Extreme Anomalies (|Residual Z-Score| > 2.5):")
print(extreme_residuals.to_string(index=False))

# Save summary tables to CSV for reference
stationarity_results_df = pd.DataFrame(stationarity_results)
stationarity_results_df.to_csv(os.path.join("reports", "stationarity_test_results.csv"), index=False)
monthly_tot.to_csv(os.path.join("reports", "statewide_monthly_timeseries_diagnostics.csv"), index=False)
print("\nSaved diagnostics to stationarity_test_results.csv and statewide_monthly_timeseries_diagnostics.csv")
