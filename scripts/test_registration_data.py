"""
ATSA: Test Suite for Registration Data Integrity & Analytical Dataset Preparation
Validates:
1. E20 labels survive cleaning and distinguish from standard Petrol.
2. Annual and monthly observations are not double-counted.
3. Aggregation correctness and exact numeric reconciliation.
4. Analytical dataset boundaries (exclusion of 202610, reporting windows, geo separation).
"""

import os
import unittest
import pandas as pd
import numpy as np

DATA_FOLDER = r"C:\Users\Zainab Motiwala\Documents\ATSA\data\clean"

class TestRegistrationData(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.clean_path = os.path.join(DATA_FOLDER, "registrations_clean.csv")
        cls.analytical_path = os.path.join(DATA_FOLDER, "registrations_analytical.csv")
        cls.mh_monthly_path = os.path.join(DATA_FOLDER, "registrations_maharashtra_monthly.csv")

        cls.df_clean = pd.read_csv(cls.clean_path, dtype={"month_id": str})
        cls.df_analytical = pd.read_csv(cls.analytical_path, dtype={"month_id": str})
        cls.df_mh = pd.read_csv(cls.mh_monthly_path, dtype={"month_id": str})

    # -------------------------------------------------------------------------
    # Test 1: E20 labels survive cleaning and remain distinct from Petrol
    # -------------------------------------------------------------------------
    def test_e20_labels_exist_and_distinct(self):
        """Verify that Petrol and Petrol-E20 are distinct, non-empty, and E20 appears from Feb 2023."""
        fuel_groups = set(self.df_clean["fuel_group"].unique())
        
        # Both must exist as separate categories
        self.assertIn("Petrol", fuel_groups, "Standard 'Petrol' missing from cleaned dataset")
        self.assertIn("Petrol-E20", fuel_groups, "Preserved 'Petrol-E20' missing from cleaned dataset")

        # Check hybrid/dual E20 categories
        self.assertIn("Petrol-E20-CNG", fuel_groups)
        self.assertIn("Petrol-E20-Hybrid", fuel_groups)
        self.assertIn("Petrol-E20-LPG", fuel_groups)

        # Raw labels must also preserve the exact source text
        raw_fuels = set(self.df_clean["fuel_raw"].unique())
        self.assertIn("PETROL", raw_fuels)
        self.assertIn("PETROL(E20)", raw_fuels)

        # E20 records must have positive counts and show exponential surge from 2023 onwards
        e20_records = self.df_clean[self.df_clean["fuel_group"] == "Petrol-E20"]
        self.assertGreater(len(e20_records), 0, "No records found for Petrol-E20")
        self.assertGreaterEqual(e20_records["count"].sum(), 1000000, "Petrol-E20 counts should exceed 1M total")
        
        # Verify post-2023 volume expansion
        e20_post2023 = e20_records[e20_records["month_id"] >= "202301"]
        self.assertGreaterEqual(e20_post2023["count"].sum(), 1000000)
        self.assertIn("202302", e20_records["month_id"].values)

    def test_e20_does_not_collapse_into_petrol(self):
        """Verify that months with both Petrol and Petrol-E20 have distinct rows for each."""
        p2024 = self.df_clean[
            (self.df_clean["month_id"] == "202401") & 
            (self.df_clean["location_id"] == "MH-ALL") &
            (self.df_clean["data_type"] == "monthly")
        ]
        petrol_row = p2024[p2024["fuel_group"] == "Petrol"]
        e20_row = p2024[p2024["fuel_group"] == "Petrol-E20"]
        
        self.assertEqual(len(petrol_row), 1, "Expected exactly 1 Petrol row in 202401 for MH-ALL")
        self.assertEqual(len(e20_row), 1, "Expected exactly 1 Petrol-E20 row in 202401 for MH-ALL")
        self.assertGreater(petrol_row["count"].values[0], 0)
        self.assertGreater(e20_row["count"].values[0], 0)

    # -------------------------------------------------------------------------
    # Test 2: Double-counting checks between annual and monthly observations
    # -------------------------------------------------------------------------
    def test_annual_monthly_separation(self):
        """Verify data_type distinguishes monthly and annual observations."""
        data_types = set(self.df_clean["data_type"].unique())
        self.assertEqual(data_types, {"monthly", "annual"})
        
        # Annual observations must have month_id ending in '00'
        annuals = self.df_clean[self.df_clean["data_type"] == "annual"]
        self.assertTrue(annuals["month_id"].str.endswith("00").all())

        # Monthly observations must have month_id between '01' and '12'
        monthlies = self.df_clean[self.df_clean["data_type"] == "monthly"]
        self.assertTrue(monthlies["month_id"].str[4:].astype(int).between(1, 12).all())

    def test_annual_equals_monthly_sum(self):
        """Verify that annual records mathematically match the sum of monthly records for MH-ALL."""
        for yr in ["2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025"]:
            annual_val = self.df_clean[
                (self.df_clean["data_type"] == "annual") &
                (self.df_clean["month_id"] == f"{yr}00") &
                (self.df_clean["location_id"] == "MH-ALL")
            ]["count"].sum()

            monthly_val = self.df_clean[
                (self.df_clean["data_type"] == "monthly") &
                (self.df_clean["month_id"].str.startswith(yr)) &
                (self.df_clean["location_id"] == "MH-ALL")
            ]["count"].sum()

            self.assertEqual(
                annual_val, monthly_val,
                f"Year {yr} annual sum ({annual_val}) does not match 12-month sum ({monthly_val})"
            )

    def test_analytical_excludes_annual_rows(self):
        """Verify that registrations_analytical.csv strictly contains zero annual rows."""
        self.assertFalse(self.df_analytical["month_id"].str.endswith("00").any())

    # -------------------------------------------------------------------------
    # Test 3: Aggregation correctness and numeric integrity
    # -------------------------------------------------------------------------
    def test_no_negative_or_null_counts(self):
        """Ensure no null, NaN, or non-positive counts exist."""
        for name, df in [("clean", self.df_clean), ("analytical", self.df_analytical)]:
            self.assertFalse(df["count"].isnull().any(), f"Null counts found in {name}")
            self.assertTrue((df["count"] > 0).all(), f"Non-positive counts found in {name}")

    def test_total_count_exact_reconciliation(self):
        """Ensure the sum of cleaned rows matches exactly the raw cell extraction sum."""
        EXPECTED_TOTAL = 57509324
        self.assertEqual(
            self.df_clean["count"].sum(), EXPECTED_TOTAL,
            f"Cleaned dataset count sum ({self.df_clean['count'].sum()}) != expected ({EXPECTED_TOTAL})"
        )

    # -------------------------------------------------------------------------
    # Test 4: Analytical dataset boundaries & partitioning
    # -------------------------------------------------------------------------
    def test_october_2026_excluded(self):
        """Verify incomplete October 2026 observations are excluded from analytical dataset."""
        self.assertNotIn("202610", self.df_analytical["month_id"].values)
        self.assertNotIn("202610", self.df_mh["month_id"].values)
        self.assertEqual(self.df_analytical["month_id"].max(), "202609")

    def test_reporting_windows(self):
        """Verify partitioning into primary_reporting (2019-2026) and historical_training (2017-2018)."""
        pre_2019 = self.df_analytical[self.df_analytical["year"] < 2019]
        post_2019 = self.df_analytical[self.df_analytical["year"] >= 2019]

        self.assertTrue((pre_2019["reporting_window"] == "historical_training").all())
        self.assertTrue((post_2019["reporting_window"] == "primary_reporting").all())

    def test_statewide_vs_rto_separation(self):
        """Verify MH-ALL is clearly separated from RTOs and never overlapping."""
        statewide = self.df_analytical[self.df_analytical["geo_level"] == "statewide"]
        rtos = self.df_analytical[self.df_analytical["geo_level"] == "rto"]

        self.assertTrue((statewide["location_id"] == "MH-ALL").all())
        self.assertFalse((rtos["location_id"] == "MH-ALL").any())

        # For every month, MH-ALL must be strictly greater than the sum of the 7 RTOs
        mh_piv = self.df_analytical.pivot_table(index="month_id", columns="location_id", values="count", aggfunc="sum")
        for m in mh_piv.index:
            mh_all = mh_piv.loc[m, "MH-ALL"]
            rto_sum = mh_piv.loc[m, [c for c in mh_piv.columns if c != "MH-ALL"]].sum()
            self.assertGreater(
                mh_all, rto_sum,
                f"Month {m}: MH-ALL ({mh_all}) should exceed sum of RTOs ({rto_sum})"
            )

if __name__ == "__main__":
    unittest.main()
