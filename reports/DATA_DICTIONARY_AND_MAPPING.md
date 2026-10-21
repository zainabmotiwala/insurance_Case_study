# Data Dictionary & Fuel Category Mapping

**Project:** Maharashtra Motor Vehicle Registrations & Insurance Analytics (ATSA)  
**Version:** 2.0 (Post-Validation & E20 Restoration)  
**Date:** October 20, 2026  

---

## 1. File Inventory & Master Datasets

| File Name | Record Count | Description | Primary Key / Index |
| :--- | :---: | :--- | :--- |
| [`registrations_clean.csv`](file:///c:/Users/Zainab%20Motiwala/Documents/ATSA/registrations_clean.csv) | 8,263 | Master cleaned VAHAN registrations (all locations, monthly + annual, raw + standardized fuels). | `month_id`, `location_id`, `fuel_raw`, `data_type` |
| [`registrations_analytical.csv`](file:///c:/Users/Zainab%20Motiwala/Documents/ATSA/registrations_analytical.csv) | 7,992 | Filtered analytical dataset for time-series modeling (`data_type == 'monthly'`, excluding partial `202610`). | `month_id`, `location_id`, `fuel_group` |
| [`registrations_maharashtra_monthly.csv`](file:///c:/Users/Zainab%20Motiwala/Documents/ATSA/registrations_maharashtra_monthly.csv) | 1,540 | Statewide-only monthly series (`location_id == 'MH-ALL'`, complete `201701`–`202609`). | `month_id`, `fuel_group` |
| [`gdpi_maharashtra.csv`](file:///c:/Users/Zainab%20Motiwala/Documents/ATSA/gdpi_maharashtra.csv) | 132 | Maharashtra annual insurance premiums (IRDAI Table 42, FY 2014-15 to FY 2024-25, 12 segments). | `fy_id`, `segment` |
| [`gdpi_segment_wise.csv`](file:///c:/Users/Zainab%20Motiwala/Documents/ATSA/gdpi_segment_wise.csv) | 352 | Non-life insurer-level national YTD premium snapshots (Dec 2024, Dec 2025, Aug 2026, Sep 2026). | `fy_id`, `period_upto`, `insurer` |
| [`fuel_prices_clean.csv`](file:///c:/Users/Zainab%20Motiwala/Documents/ATSA/fuel_prices_clean.csv) | 223 | PPAC fortnightly crude basket prices, exchange rates, and under-recoveries (2014–2024). | `date` |

---

## 2. Dataset Schemas & Attribute Definitions

### A. `registrations_analytical.csv`

| Column Name | Data Type | Permitted Values / Format | Description & Business Logic |
| :--- | :--- | :--- | :--- |
| `month_id` | `VARCHAR(6)` | `201701` to `202609` | Month identifier in `YYYYMM` format. |
| `date` | `DATE` | `YYYY-MM-01` | First day of the observation month for time-series indexing. |
| `year` | `INTEGER` | `2017` to `2026` | Calendar year. |
| `month` | `INTEGER` | `1` to `12` | Calendar month number. |
| `location_id` | `VARCHAR(20)` | `MH-ALL`, `MH-MUMBAI`, `MH-PUNE`, `MH-PIMPRI`, `MH-NASHIK`, `MH-AURANGABAD`, `MH-THANE`, `MH-VASHI` | RTO jurisdiction code or statewide aggregation tag. |
| `geo_level` | `VARCHAR(15)` | `statewide`, `rto` | Prevents double-counting: `statewide` for `MH-ALL`, `rto` for individual RTO offices. Never sum across both. |
| `fuel_raw` | `VARCHAR(50)` | Exact VAHAN source string | Unaltered fuel label as transcribed in the raw VAHAN workbook. |
| `fuel_group` | `VARCHAR(30)` | Standardized categories | Standardized powertrain category preserving distinct E20 tags. |
| `reporting_window`| `VARCHAR(25)`| `primary_reporting`, `historical_training` | Partition identifier: `primary_reporting` (`201901`–`202609`), `historical_training` (`201701`–`201812`). |
| `count` | `INTEGER` | $\ge 1$ | Monthly vehicle registration count. |

### B. `gdpi_maharashtra.csv`

| Column Name | Data Type | Format / Units | Description |
| :--- | :--- | :--- | :--- |
| `fy_id` | `VARCHAR(7)` | `2014-15` to `2024-25` | Indian Financial Year (April 1 to March 31). |
| `state` | `VARCHAR(20)` | `Maharasthra` | Geographic territory (Maharashtra statewide). |
| `segment` | `VARCHAR(30)` | Line of business | Segment name: `Motor Own Damage`, `Motor Third Party`, `Fire`, `Marine Cargo`, `Grand Total`, etc. |
| `premium_crore`| `DECIMAL(12,4)`| **₹ Crore** | Gross Direct Premium Income underwritten in Maharashtra. |

---

## 3. Comprehensive Fuel Category Mapping Rules

The mapping logic resolves 26 raw source labels into 16 standardized groups. All E20 distinctions are strictly preserved.

```
VAHAN Source Labels                        Cleaned Group (fuel_group)      Macro Powertrain Group
─────────────────────────────────────────────────────────────────────────────────────────────────
PETROL                                  ──► Petrol                      ──► Petrol (Standard)
PETROL(E20) / PETROL E20                ──► Petrol-E20                  ──► Petrol-E20
PETROL/CNG                              ──► Petrol-CNG                  ──► CNG & Bi-Fuel
PETROL(E20)/CNG                         ──► Petrol-E20-CNG              ──► CNG & Bi-Fuel
PETROL/LPG                              ──► Petrol-LPG                  ──► Other
PETROL(E20)/LPG                         ──► Petrol-E20-LPG              ──► Other
PETROL/HYBRID / PETROL/HYBRID/CNG       ──► Petrol-Hybrid               ──► Hybrid (Petrol/SHEV/PHEV)
PETROL(E20)/HYBRID / .../HYBRID/CNG     ──► Petrol-E20-Hybrid           ──► Hybrid (Petrol/SHEV/PHEV)
DIESEL                                  ──► Diesel                      ──► Diesel
DIESEL/HYBRID                           ──► Diesel-Hybrid               ──► Diesel-Hybrid
DUAL DIESEL/CNG                         ──► Diesel-CNG                  ──► Diesel-CNG
DUAL DIESEL/LNG                         ──► Diesel-LNG                  ──► Diesel-LNG
CNG ONLY / HCNG                         ──► CNG                         ──► CNG & Bi-Fuel
LPG ONLY                                ──► LPG                         ──► Other
LNG                                     ──► LNG                         ──► Other
ELECTRIC(BOV)                           ──► Electric-BOV                ──► Electric (Pure EV + BOV)
PURE EV                                 ──► Pure EV                     ──► Electric (Pure EV + BOV)
PLUG-IN HYBRID EV                       ──► PHEV                        ──► Hybrid (Petrol/SHEV/PHEV)
STRONG HYBRID EV                        ──► Strong Hybrid EV            ──► Hybrid (Petrol/SHEV/PHEV)
ETHANOL(E100)                           ──► Ethanol                     ──► Other
FLEX-FUEL(ETHANOL)                      ──► Flex-Fuel (Ethanol)         ──► Other
SOLAR                                   ──► Solar                       ──► Other
NOT APPLICABLE                          ──► Not Applicable              ──► Other
```

---

## 4. Analytical Guardrails & Aggregation Integrity Rules

1. **Rule 1 (Statewide Filtering):** When computing Maharashtra statewide volume, filter exclusively on `location_id == 'MH-ALL'`. Never sum `MH-ALL` with RTO rows.
2. **Rule 2 (Temporal Slicing):**
   * Primary reporting and baseline evaluation: `reporting_window == 'primary_reporting'` (`201901` to `202609`).
   * Historical initialization/pre-training: `reporting_window == 'historical_training'` (`201701` to `201812`).
   * Never include `202610` (October 2026 is partial mid-month volume).
3. **Rule 3 (Powertrain Modeling):**
   * To study aggregate ICE substitution, use `Petrol Combined = Petrol + Petrol-E20`.
   * To study E20 policy scaling, compute `E20 Penetration = Petrol-E20 / (Petrol + Petrol-E20)`.
   * For EV adoption, sum `Pure EV + Electric-BOV` to bridge the administrative reclassification that took place in 2022.
4. **Rule 4 (Insurance Granularity):** GDPI data from Table 42 is annual full-year in ₹ Crore. Do not linearly divide by 12 to manufacture monthly insurance premium series.
