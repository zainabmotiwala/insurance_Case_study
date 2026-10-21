"""
ATSA: Rebuild Cleaned and Analytical Registration Datasets
Preserving distinct E20 categories, original raw fuel labels, and analytical partitioning.
Workspace: C:/Users/Zainab Motiwala/Documents/ATSA
"""

import os
import re
import glob
import openpyxl
import pandas as pd
import numpy as np
from pathlib import Path

DATA_FOLDER = r"C:\Users\Zainab Motiwala\Documents\ATSA"
RAW_FOLDER = os.path.join(DATA_FOLDER, "data", "raw")
CLEAN_FOLDER = os.path.join(DATA_FOLDER, "data", "clean")
os.makedirs(CLEAN_FOLDER, exist_ok=True)
os.chdir(DATA_FOLDER)

# -----------------------------------------------------------------------------
# 1. Number Cleaning Helper
# -----------------------------------------------------------------------------
def clean_number(val):
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return None
    if isinstance(val, (int, float)):
        return int(val) if float(val) == int(val) else float(val)
    s = str(val).replace(",", "").replace("\u20b9", "").replace("\xa0", "").strip()
    try:
        f = float(s)
        return int(f) if f == int(f) else f
    except:
        return None

# -----------------------------------------------------------------------------
# 2. Fuel Mapping: Preserving E20 categories and standardizing
# -----------------------------------------------------------------------------
FUEL_MAPPING = {
    "PETROL":                    "Petrol",
    "PETROL(E20)":               "Petrol-E20",
    "PETROL E20":                "Petrol-E20",
    "PETROL/CNG":                "Petrol-CNG",
    "PETROL(E20)/CNG":           "Petrol-E20-CNG",
    "PETROL/LPG":                "Petrol-LPG",
    "PETROL(E20)/LPG":           "Petrol-E20-LPG",
    "PETROL/HYBRID":             "Petrol-Hybrid",
    "PETROL/HYBRID/CNG":         "Petrol-Hybrid",
    "PETROL(E20)/HYBRID":        "Petrol-E20-Hybrid",
    "PETROL(E20)/HYBRID/CNG":    "Petrol-E20-Hybrid",
    "DIESEL":                    "Diesel",
    "DIESEL/HYBRID":             "Diesel-Hybrid",
    "DUAL DIESEL/CNG":           "Diesel-CNG",
    "DUAL DIESEL/LNG":           "Diesel-LNG",
    "CNG ONLY":                  "CNG",
    "HCNG":                      "CNG",
    "LPG ONLY":                  "LPG",
    "LNG":                       "LNG",
    "ELECTRIC(BOV)":             "Electric-BOV",
    "PURE EV":                   "Pure EV",
    "PLUG-IN HYBRID EV":         "PHEV",
    "STRONG HYBRID EV":          "Strong Hybrid EV",
    "ETHANOL(E100)":             "Ethanol",
    "FLEX-FUEL(ETHANOL)":        "Flex-Fuel (Ethanol)",
    "SOLAR":                     "Solar",
    "NOT APPLICABLE":            "Not Applicable",
}

def normalize_fuel(raw_fuel_str):
    raw = raw_fuel_str.strip().upper()
    return FUEL_MAPPING.get(raw, f"Other ({raw_fuel_str.strip()})")

def get_location(filename):
    f = filename.lower()
    if "pimpri" in f:        return "MH-PIMPRI"
    elif "pune" in f:        return "MH-PUNE"
    elif "mh1_" in f or "mumbaicentral" in f: return "MH-MUMBAI"
    elif "thane" in f:       return "MH-THANE"
    elif "nashik" in f:      return "MH-NASHIK"
    elif "vashi" in f:       return "MH-VASHI"
    elif "aurangabad" in f or "mh20" in f: return "MH-AURANGABAD"
    return "MH-ALL"

def is_annual_file(filename):
    return "annual" in filename.lower()

MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"]
MONTH_NUM = {m: i+1 for i, m in enumerate(MONTHS)}

# -----------------------------------------------------------------------------
# 3. Extraction from Raw VAHAN Excel Workbooks
# -----------------------------------------------------------------------------
reg_files = sorted(glob.glob(os.path.join(RAW_FOLDER, "*FuelType*.xlsx")))
print(f"Processing {len(reg_files)} raw VAHAN Excel files...")

rows = []
raw_counts_total = 0

for full_path in reg_files:
    fname = os.path.basename(full_path)
    location_id = get_location(fname)
    annual = is_annual_file(fname)

    wb = openpyxl.load_workbook(full_path, data_only=True)
    sheet = wb.active

    title_cell = sheet.cell(1, 1).value or ""
    year_match = re.search(r"\((\d{4})\)", str(title_cell))
    file_year = int(year_match.group(1)) if year_match else None

    header_row = [sheet.cell(4, c).value for c in range(1, sheet.max_column + 1)]
    header_row = [str(h).strip().replace("\xa0", "").strip() if h else None for h in header_row]

    for r in range(5, sheet.max_row + 1):
        fuel_raw = sheet.cell(r, 2).value
        if fuel_raw is None:
            continue
        fuel_raw_str = str(fuel_raw).replace("\xa0", "").strip()
        if not fuel_raw_str:
            continue
        fuel_group = normalize_fuel(fuel_raw_str)

        for c_idx, header in enumerate(header_row, start=1):
            if header is None or header == "":
                continue
            if "total" in header.lower():
                continue
            cell_val = sheet.cell(r, c_idx).value
            count = clean_number(cell_val)
            if count is None or count <= 0:
                continue

            raw_counts_total += count
            if annual:
                try:
                    yr = int(header)
                    month_id = f"{yr:04d}00"
                    rows.append({
                        "month_id": month_id,
                        "location_id": location_id,
                        "fuel_raw": fuel_raw_str,
                        "fuel_group": fuel_group,
                        "data_type": "annual",
                        "count": count
                    })
                except:
                    pass
            else:
                mon_upper = header.upper()
                if mon_upper in MONTH_NUM and file_year:
                    month_id = f"{file_year:04d}{MONTH_NUM[mon_upper]:02d}"
                    rows.append({
                        "month_id": month_id,
                        "location_id": location_id,
                        "fuel_raw": fuel_raw_str,
                        "fuel_group": fuel_group,
                        "data_type": "monthly",
                        "count": count
                    })

df_raw = pd.DataFrame(rows)
print(f"Extracted {len(df_raw):,} raw observation cells representing {raw_counts_total:,} vehicle registrations.")

# -----------------------------------------------------------------------------
# 4. Generate registrations_clean.csv (Complete Clean Master Dataset)
# -----------------------------------------------------------------------------
reg_clean = (
    df_raw
    .groupby(["month_id", "location_id", "fuel_raw", "fuel_group", "data_type"], as_index=False)["count"]
    .sum()
    .sort_values(["location_id", "month_id", "fuel_group", "fuel_raw"])
    .reset_index(drop=True)
)
reg_clean["count"] = reg_clean["count"].astype(int)

# Export registrations_clean.csv
reg_clean.to_csv(os.path.join(CLEAN_FOLDER, "registrations_clean.csv"), index=False)
print(f"Exported registrations_clean.csv: {len(reg_clean):,} rows | sum={reg_clean['count'].sum():,}")

# -----------------------------------------------------------------------------
# 5. Generate registrations_analytical.csv (Time-Series Analytical Dataset)
# Guidelines:
# - data_type == 'monthly'
# - location_id == 'MH-ALL' for statewide totals, with RTOs flagged separately
# - Exclude incomplete October 2026 (202610)
# - Primary reporting window: January 2019 - September 2026 (201901 - 202609)
# - Historical training window: January 2017 - December 2018 (201701 - 201812)
# -----------------------------------------------------------------------------
analytical_df = reg_clean[
    (reg_clean["data_type"] == "monthly") &
    (reg_clean["month_id"] != "202610")
].copy()

# Add temporal and partition fields
analytical_df["year"] = analytical_df["month_id"].str[:4].astype(int)
analytical_df["month"] = analytical_df["month_id"].str[4:].astype(int)
analytical_df["date"] = pd.to_datetime(analytical_df["year"].astype(str) + "-" + analytical_df["month"].astype(str) + "-01").dt.strftime("%Y-%m-%d")

# Add reporting window flag
analytical_df["reporting_window"] = np.where(
    analytical_df["year"] >= 2019,
    "primary_reporting",
    "historical_training"
)

# Add geographical level flag
analytical_df["geo_level"] = np.where(
    analytical_df["location_id"] == "MH-ALL",
    "statewide",
    "rto"
)

# Reorder columns
cols_order = [
    "month_id", "date", "year", "month",
    "location_id", "geo_level",
    "fuel_raw", "fuel_group",
    "reporting_window", "count"
]
analytical_df = analytical_df[cols_order].sort_values(["location_id", "month_id", "fuel_group", "fuel_raw"]).reset_index(drop=True)

# Export analytical datasets
analytical_df.to_csv(os.path.join(CLEAN_FOLDER, "registrations_analytical.csv"), index=False)
print(f"Exported registrations_analytical.csv: {len(analytical_df):,} rows | sum={analytical_df['count'].sum():,}")

# Also export dedicated Maharashtra statewide monthly dataset for convenience
mh_analytical = analytical_df[analytical_df["location_id"] == "MH-ALL"].reset_index(drop=True)
mh_analytical.to_csv(os.path.join(CLEAN_FOLDER, "registrations_maharashtra_monthly.csv"), index=False)
print(f"Exported registrations_maharashtra_monthly.csv: {len(mh_analytical):,} rows | sum={mh_analytical['count'].sum():,}")

print("\nRebuild completed successfully.")
