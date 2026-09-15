"""
Sensor Telemetry Anomaly Detector.
Combines Isolation Forest unsupervised anomaly detection with multi-sensor Z-score statistical bounds
for military aircraft condition monitoring.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

from src.backend.app.ml.cmapss_loader import load_raw_dataset, INFORMATIVE_SENSORS, SENSOR_METADATA

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("AnomalyDetector")


class TelemetryAnomalyDetector:
    """
    Detects sensor drift, thermal runaway, and mechanical vibration anomalies.
    """

    def __init__(self, contamination: float = 0.05, random_state: int = 42):
        self.contamination = contamination
        self.random_state = random_state
        self.iso_forest = IsolationForest(
            n_estimators=150,
            contamination=contamination,
            max_samples=512,
            random_state=random_state,
            n_jobs=-1
        )
        self.sensor_stats: Dict[str, Dict[str, float]] = {}
        self.informative_sensors = INFORMATIVE_SENSORS

    def fit_baseline(self, train_df: pd.DataFrame, healthy_cycle_cutoff: int = 30) -> "TelemetryAnomalyDetector":
        """
        Fits the anomaly model strictly on healthy early-life operational cycles.
        """
        healthy_data = train_df[train_df["time_cycles"] <= healthy_cycle_cutoff]
        X_healthy = healthy_data[self.informative_sensors].dropna()

        # 1. Compute statistical baseline (mean, std, 1st/99th percentiles)
        for sensor in self.informative_sensors:
            series = X_healthy[sensor]
            mean_val = float(series.mean())
            std_val = float(series.std()) if float(series.std()) > 1e-6 else 1.0
            p1_val = float(series.quantile(0.01))
            p99_val = float(series.quantile(0.99))

            self.sensor_stats[sensor] = {
                "mean": mean_val,
                "std": std_val,
                "p01": p1_val,
                "p99": p99_val,
                "name": SENSOR_METADATA.get(sensor, {}).get("name", sensor),
                "unit": SENSOR_METADATA.get(sensor, {}).get("unit", ""),
            }

        # 2. Fit Isolation Forest on baseline healthy telemetry
        self.iso_forest.fit(X_healthy)
        logger.info(f"Anomaly baseline fitted on {len(X_healthy)} healthy operational cycles across {len(self.informative_sensors)} sensors.")
        return self

    def score_telemetry(self, sensor_readings: Dict[str, float]) -> Dict[str, Any]:
        """
        Evaluates a single telemetry snapshot:
        - Computes per-sensor Z-scores and deviation percentages
        - Generates overall multi-variate anomaly score (0.0 normal -> 1.0 critical)
        - Flags specific sensors violating 3-sigma or percentile thresholds
        """
        row_values = []
        sensor_anomalies = []

        for sensor in self.informative_sensors:
            val = sensor_readings.get(sensor, self.sensor_stats[sensor]["mean"])
            row_values.append(val)

            stats = self.sensor_stats[sensor]
            z_score = (val - stats["mean"]) / stats["std"]
            abs_z = abs(z_score)

            if abs_z > 2.5 or val < stats["p01"] or val > stats["p99"]:
                sensor_anomalies.append({
                    "sensor_id": sensor,
                    "sensor_name": stats["name"],
                    "value": round(val, 3),
                    "expected_mean": round(stats["mean"], 3),
                    "unit": stats["unit"],
                    "z_score": round(z_score, 2),
                    "severity": "CRITICAL" if abs_z > 3.5 else "WARNING"
                })

        # Isolation forest anomaly score (-0.5 to 0.5, lower is more anomalous)
        X = np.array([row_values])
        raw_score = self.iso_forest.decision_function(X)[0]
        # Normalize into 0.0 (healthy) -> 1.0 (severely anomalous)
        anomaly_probability = float(np.clip(1.0 - (raw_score + 0.3) / 0.6, 0.0, 1.0))
        is_anomalous = anomaly_probability > 0.60 or len(sensor_anomalies) >= 2

        return {
            "is_anomalous": is_anomalous,
            "anomaly_score": round(anomaly_probability, 3),
            "flagged_sensors_count": len(sensor_anomalies),
            "flagged_sensors": sensor_anomalies
        }

    def save(self, save_dir: Optional[Path] = None) -> Path:
        if save_dir is None:
            save_dir = Path(__file__).resolve().parent / "weights"
        save_dir.mkdir(parents=True, exist_ok=True)

        model_path = save_dir / "anomaly_detector.joblib"
        stats_path = save_dir / "sensor_baselines.json"

        joblib.dump(self.iso_forest, model_path)
        with open(stats_path, "w", encoding="utf-8") as f:
            json.dump(self.sensor_stats, f, indent=2)

        logger.info(f"Saved anomaly detector model to {model_path} and baselines to {stats_path}")
        return model_path

    @classmethod
    def load(cls, save_dir: Optional[Path] = None) -> "TelemetryAnomalyDetector":
        if save_dir is None:
            save_dir = Path(__file__).resolve().parent / "weights"

        model_path = save_dir / "anomaly_detector.joblib"
        stats_path = save_dir / "sensor_baselines.json"

        detector = cls()
        detector.iso_forest = joblib.load(model_path)
        with open(stats_path, "r", encoding="utf-8") as f:
            detector.sensor_stats = json.load(f)
        return detector


def train_anomaly_detector(subset: str = "FD001", save_dir: Optional[Path] = None):
    train_df, _, _ = load_raw_dataset(subset=subset)
    detector = TelemetryAnomalyDetector()
    detector.fit_baseline(train_df, healthy_cycle_cutoff=30)
    detector.save(save_dir=save_dir)
    return detector


if __name__ == "__main__":
    detector = train_anomaly_detector()
    # Test on a simulated late-cycle degraded snapshot
    sample_degraded = {
        "s_2": 643.5,
        "s_3": 1605.0,  # elevated HPC temp
        "s_4": 1435.0,  # high LPT temp
        "s_7": 551.2,
        "s_8": 2388.1,
        "s_9": 9070.0,
        "s_11": 48.0,
        "s_12": 520.5,
        "s_13": 2388.2,
        "s_14": 8135.0,
        "s_15": 8.52,   # elevated bypass ratio
        "s_17": 395.0,
        "s_20": 38.2,
        "s_21": 23.1
    }
    result = detector.score_telemetry(sample_degraded)
    print("Test scoring result:", json.dumps(result, indent=2))
