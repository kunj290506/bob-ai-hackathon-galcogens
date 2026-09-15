"""
Unified Machine Learning Prognostics & Health Management (PHM) Predictor.
Provides runtime inference for Remaining Useful Life (RUL) and multi-sensor anomaly detection.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import joblib
import numpy as np
import pandas as pd

from src.backend.app.ml.anomaly_detector import TelemetryAnomalyDetector
from src.backend.app.ml.cmapss_loader import INFORMATIVE_SENSORS, engineer_features

logger = logging.getLogger("PHMPredictor")


class FleetPredictor:
    """
    Production inference engine for Fleet Component Health, RUL, and Anomaly Detection.
    """

    _instance: Optional["FleetPredictor"] = None

    def __init__(self, weights_dir: Optional[Path] = None):
        if weights_dir is None:
            weights_dir = Path(__file__).resolve().parent / "weights"

        self.weights_dir = weights_dir
        self.model_path = weights_dir / "rul_xgboost_model.joblib"
        self.feature_meta_path = weights_dir / "feature_columns.json"

        # Load RUL model & feature metadata
        if not self.model_path.exists():
            raise FileNotFoundError(f"Model file not found at {self.model_path}. Train model first.")

        self.rul_model = joblib.load(self.model_path)
        with open(self.feature_meta_path, "r", encoding="utf-8") as f:
            self.feature_meta = json.load(f)
        self.expected_features: List[str] = self.feature_meta["features"]

        # Load Anomaly Detector
        self.anomaly_detector = TelemetryAnomalyDetector.load(save_dir=weights_dir)
        logger.info("FleetPredictor successfully initialized with production model weights.")

    @classmethod
    def get_instance(cls, weights_dir: Optional[Path] = None) -> "FleetPredictor":
        if cls._instance is None:
            cls._instance = cls(weights_dir=weights_dir)
        return cls._instance

    def predict_component_health(
        self,
        telemetry_history: List[Dict[str, Any]],
        mission_window_hours: float = 40.0
    ) -> Dict[str, Any]:
        """
        Analyzes historical telemetry snapshots for an asset component to:
        1. Predict Remaining Useful Life (RUL in operational cycles / hours)
        2. Detect current sensor anomalies & drift
        3. Evaluate failure risk before the next mission window
        4. Classify risk level (LOW, MEDIUM, HIGH, CRITICAL)
        """
        if not telemetry_history:
            return {
                "predicted_rul": 125.0,
                "confidence_interval": [110.0, 125.0],
                "risk_level": "LOW",
                "fails_before_mission": False,
                "anomaly_score": 0.0,
                "is_anomalous": False,
                "flagged_sensors": [],
                "explanation": "Insufficient telemetry history. Defaulting to nominal baseline."
            }

        # Convert history to DataFrame
        df = pd.DataFrame(telemetry_history)
        if "unit_nr" not in df.columns:
            df["unit_nr"] = 1
        if "time_cycles" not in df.columns:
            df["time_cycles"] = np.arange(1, len(df) + 1)

        # 1. Anomaly scoring on most recent telemetry snapshot
        latest_snapshot = df.iloc[-1].to_dict()
        anomaly_results = self.anomaly_detector.score_telemetry(latest_snapshot)

        # 2. Feature engineering for RUL model
        engineered = engineer_features(df, sensor_cols=INFORMATIVE_SENSORS, windows=(5, 10))

        # Take latest row
        latest_features_row = engineered.iloc[-1:]

        # Ensure all expected columns exist
        for col in self.expected_features:
            if col not in latest_features_row.columns:
                latest_features_row[col] = 0.0

        X_input = latest_features_row[self.expected_features]

        # Predict RUL
        raw_rul = float(self.rul_model.predict(X_input)[0])
        predicted_rul = max(1.0, round(raw_rul, 1))

        # Confidence bounds (based on empirical test MAE ~12.75 cycles)
        mae_margin = 12.5
        lower_bound = max(0.0, round(predicted_rul - mae_margin, 1))
        upper_bound = round(predicted_rul + mae_margin, 1)

        # Evaluate risk level
        fails_before_mission = predicted_rul <= mission_window_hours

        if predicted_rul <= 15.0 or anomaly_results["anomaly_score"] > 0.85:
            risk_level = "CRITICAL"
        elif predicted_rul <= 35.0 or anomaly_results["anomaly_score"] > 0.65:
            risk_level = "HIGH"
        elif predicted_rul <= 60.0 or anomaly_results["is_anomalous"]:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # Generate diagnostic explanation summary
        explanations = []
        if fails_before_mission:
            explanations.append(
                f"CRITICAL: Component RUL ({predicted_rul} hrs) is within the upcoming mission operational window ({mission_window_hours} hrs)."
            )
        if anomaly_results["is_anomalous"]:
            flagged_names = [f"{s['sensor_name']} ({s['severity']}: {s['value']} {s['unit']})" for s in anomaly_results["flagged_sensors"][:3]]
            explanations.append(f"Sensors exhibiting severe drift: {', '.join(flagged_names)}.")
        if not explanations:
            explanations.append(f"Component is operating well within nominal flight boundaries with estimated {predicted_rul} cycles of useful life remaining.")

        return {
            "predicted_rul": predicted_rul,
            "confidence_interval": [lower_bound, upper_bound],
            "risk_level": risk_level,
            "fails_before_mission": fails_before_mission,
            "anomaly_score": anomaly_results["anomaly_score"],
            "is_anomalous": anomaly_results["is_anomalous"],
            "flagged_sensors": anomaly_results["flagged_sensors"],
            "explanation": " ".join(explanations)
        }
