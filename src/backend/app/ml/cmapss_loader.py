"""
NASA C-MAPSS Turbofan Engine Degradation Dataset Loader & Feature Pipeline.
Industry-standard preprocessing for Remaining Useful Life (RUL) estimation.
"""

import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd

# Standard C-MAPSS column names
INDEX_COLS = ["unit_nr", "time_cycles"]
SETTING_COLS = ["setting_1", "setting_2", "setting_3"]
SENSOR_COLS = [f"s_{i}" for i in range(1, 22)]
ALL_COLS = INDEX_COLS + SETTING_COLS + SENSOR_COLS

# Informative sensors with high variance across wear states (excluding flatlined sensors)
INFORMATIVE_SENSORS = [
    "s_2", "s_3", "s_4", "s_7", "s_8", "s_9",
    "s_11", "s_12", "s_13", "s_14", "s_15", "s_17", "s_20", "s_21"
]

# Mapping C-MAPSS sensor IDs to human-readable aerospace engineering names
SENSOR_METADATA = {
    "s_1": {"name": "Fan Inlet Temperature", "symbol": "T2", "unit": "deg R"},
    "s_2": {"name": "LPC Outlet Temperature", "symbol": "T24", "unit": "deg R"},
    "s_3": {"name": "HPC Outlet Temperature", "symbol": "T30", "unit": "deg R"},
    "s_4": {"name": "LPT Outlet Temperature", "symbol": "T50", "unit": "deg R"},
    "s_5": {"name": "Fan Inlet Pressure", "symbol": "P2", "unit": "psia"},
    "s_6": {"name": "Bypass Duct Pressure", "symbol": "P15", "unit": "psia"},
    "s_7": {"name": "HPC Outlet Total Pressure", "symbol": "P30", "unit": "psia"},
    "s_8": {"name": "Physical Fan Speed", "symbol": "Nf", "unit": "rpm"},
    "s_9": {"name": "Physical Core Speed", "symbol": "Nc", "unit": "rpm"},
    "s_10": {"name": "Engine Pressure Ratio", "symbol": "EPR", "unit": ""},
    "s_11": {"name": "HPC Outlet Static Pressure", "symbol": "Ps30", "unit": "psia"},
    "s_12": {"name": "Fuel Flow to Ps30 Ratio", "symbol": "phi", "unit": "pps/psia"},
    "s_13": {"name": "Corrected Fan Speed", "symbol": "NRf", "unit": "rpm"},
    "s_14": {"name": "Corrected Core Speed", "symbol": "NRc", "unit": "rpm"},
    "s_15": {"name": "Bypass Ratio", "symbol": "BPR", "unit": ""},
    "s_16": {"name": "Burner Fuel-Air Ratio", "symbol": "farB", "unit": ""},
    "s_17": {"name": "Bleed Enthalpy", "symbol": "htBleed", "unit": ""},
    "s_18": {"name": "Demanded Fan Speed", "symbol": "Nf_dmd", "unit": "rpm"},
    "s_19": {"name": "Demanded Corrected Fan Speed", "symbol": "PCNfR_dmd", "unit": "rpm"},
    "s_20": {"name": "HPT Coolant Bleed", "symbol": "W31", "unit": "lbm/s"},
    "s_21": {"name": "LPT Coolant Bleed", "symbol": "W32", "unit": "lbm/s"},
}


def find_dataset_dir() -> Path:
    """Locates the NASA C-MAPSS raw data directory."""
    candidates = [
        Path("ForAntigravity/data/raw/nasa_cmapss"),
        Path("../ForAntigravity/data/raw/nasa_cmapss"),
        Path("../../ForAntigravity/data/raw/nasa_cmapss"),
        Path(__file__).resolve().parent.parent.parent.parent.parent / "ForAntigravity" / "data" / "raw" / "nasa_cmapss",
    ]
    for p in candidates:
        if p.exists() and (p / "train_FD001.txt").exists():
            return p
    raise FileNotFoundError("Could not locate NASA C-MAPSS dataset directory.")


def load_raw_dataset(subset: str = "FD001", data_dir: Optional[Path] = None) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Loads raw train, test, and true RUL data for a specific subset (e.g. 'FD001').
    """
    if data_dir is None:
        data_dir = find_dataset_dir()

    train_path = data_dir / f"train_{subset}.txt"
    test_path = data_dir / f"test_{subset}.txt"
    rul_path = data_dir / f"RUL_{subset}.txt"

    train_df = pd.read_csv(train_path, sep=r"\s+", header=None, names=ALL_COLS)
    test_df = pd.read_csv(test_path, sep=r"\s+", header=None, names=ALL_COLS)
    rul_df = pd.read_csv(rul_path, sep=r"\s+", header=None, names=["true_rul"])
    rul_df["unit_nr"] = np.arange(1, len(rul_df) + 1)

    return train_df, test_df, rul_df


def add_piecewise_rul(df: pd.DataFrame, max_rul: float = 125.0) -> pd.DataFrame:
    """
    Calculates Remaining Useful Life (RUL) with piecewise linear degradation clipping.
    Standard in PHM literature: early flight cycles show no measurable degradation.
    """
    df = df.copy()
    max_cycles = df.groupby("unit_nr")["time_cycles"].max().reset_index()
    max_cycles.columns = ["unit_nr", "max_cycle"]
    df = df.merge(max_cycles, on="unit_nr", how="left")
    df["rul_raw"] = df["max_cycle"] - df["time_cycles"]
    df["RUL"] = df["rul_raw"].clip(upper=max_rul)
    df.drop(columns=["max_cycle", "rul_raw"], inplace=True)
    return df


def engineer_features(
    df: pd.DataFrame,
    sensor_cols: Optional[List[str]] = None,
    windows: Tuple[int, ...] = (5, 10)
) -> pd.DataFrame:
    """
    Engineers industrial condition monitoring features:
    - Moving window averages (de-noising)
    - Moving window standard deviations (vibration / turbulence instability)
    - Trend deltas (deviation from rolling baseline)
    """
    if sensor_cols is None:
        sensor_cols = INFORMATIVE_SENSORS

    df = df.copy()
    grouped = df.groupby("unit_nr")

    for w in windows:
        for s in sensor_cols:
            mean_col = f"{s}_mean_{w}"
            std_col = f"{s}_std_{w}"
            delta_col = f"{s}_delta_{w}"

            # Rolling statistics within each unit
            roll = grouped[s].rolling(window=w, min_periods=1)
            df[mean_col] = roll.mean().reset_index(level=0, drop=True)
            df[std_col] = roll.std().fillna(0.0).reset_index(level=0, drop=True)
            df[delta_col] = df[s] - df[mean_col]

    return df


def prepare_training_data(
    subset: str = "FD001",
    max_rul: float = 125.0,
    windows: Tuple[int, ...] = (5, 10)
) -> Tuple[pd.DataFrame, pd.Series, List[str]]:
    """
    End-to-end data preparation returning feature matrix X, target y (RUL), and feature names.
    """
    train_df, _, _ = load_raw_dataset(subset=subset)
    train_df = add_piecewise_rul(train_df, max_rul=max_rul)
    train_df = engineer_features(train_df, sensor_cols=INFORMATIVE_SENSORS, windows=windows)

    feature_cols = [c for c in train_df.columns if c not in ["unit_nr", "time_cycles", "RUL"]]
    X = train_df[feature_cols]
    y = train_df["RUL"]

    return X, y, feature_cols


def prepare_test_data(
    subset: str = "FD001",
    max_rul: float = 125.0,
    windows: Tuple[int, ...] = (5, 10)
) -> Tuple[pd.DataFrame, pd.Series, List[str]]:
    """
    Prepares test data evaluating at the final available cycle of each test unit.
    Matches test features against the true RUL ground truth vector.
    """
    _, test_df, rul_df = load_raw_dataset(subset=subset)
    test_df = engineer_features(test_df, sensor_cols=INFORMATIVE_SENSORS, windows=windows)

    # Take the last recorded snapshot for each test engine
    last_records = test_df.groupby("unit_nr").last().reset_index()
    last_records = last_records.merge(rul_df, on="unit_nr", how="left")
    last_records["RUL"] = last_records["true_rul"].clip(upper=max_rul)

    feature_cols = [c for c in last_records.columns if c not in ["unit_nr", "time_cycles", "RUL", "true_rul"]]
    X_test = last_records[feature_cols]
    y_test = last_records["RUL"]

    return X_test, y_test, feature_cols
