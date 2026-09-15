"""
Unit Tests for Machine Learning RUL Prognostic Predictor.
Verifies XGBoost RUL inference, empirical error bounds, feature engineering,
and deterministic failure risk classification.
"""

import pytest
from src.backend.app.ml.predictor import FleetPredictor


@pytest.fixture
def predictor():
    """Retrieves singleton FleetPredictor instance."""
    return FleetPredictor.get_instance()


def test_empty_telemetry_history_returns_nominal_baseline(predictor):
    """Empty history gracefully defaults to healthy nominal baseline."""
    res = predictor.predict_component_health([])
    assert res["predicted_rul"] == 125.0
    assert res["risk_level"] == "LOW"
    assert res["fails_before_mission"] is False
    assert res["is_anomalous"] is False


def test_nominal_telemetry_inference(predictor):
    """Multi-cycle nominal flight telemetry yields high RUL and empirical error bounds."""
    nominal_cycles = []
    for c in range(1, 15):
        nominal_cycles.append({
            "unit_nr": 1,
            "time_cycles": c,
            "s_2": 642.3, "s_3": 1586.9, "s_4": 1402.8, "s_7": 553.9,
            "s_8": 2388.0, "s_9": 9060.0, "s_11": 47.3, "s_12": 521.9,
            "s_13": 2388.0, "s_14": 8130.0, "s_15": 8.41, "s_17": 393.0,
            "s_20": 38.9, "s_21": 23.3
        })

    res = predictor.predict_component_health(nominal_cycles, mission_window_hours=40.0)
    assert res["predicted_rul"] > 50.0
    assert res["interval_type"] == "empirical_mae_bounds"
    assert res["risk_method"] == "deterministic_rul_and_anomaly_thresholds"
    assert len(res["confidence_interval"]) == 2
    lower, upper = res["confidence_interval"]
    assert lower <= res["predicted_rul"] <= upper
    assert round(upper - lower, 1) == 25.0  # +/- 12.5 empirical holdout MAE


def test_degraded_telemetry_predicts_low_rul_and_risk(predictor):
    """Heavily degraded telemetry sequence predicts low RUL and critical failure risk."""
    degraded_cycles = []
    # Simulate aging progression with rising temperatures and bypass ratio drift
    for c in range(1, 40):
        bias = c * 0.8
        degraded_cycles.append({
            "unit_nr": 1,
            "time_cycles": c,
            "s_2": 642.3 + bias * 0.05,
            "s_3": 1586.9 + bias * 0.9,
            "s_4": 1402.8 + bias * 1.1,
            "s_7": 553.9 - bias * 0.1,
            "s_8": 2388.0 + bias * 0.02,
            "s_9": 9060.0 + bias * 0.8,
            "s_11": 47.3 + bias * 0.04,
            "s_12": 521.9 - bias * 0.08,
            "s_13": 2388.0 + bias * 0.02,
            "s_14": 8130.0 + bias * 0.7,
            "s_15": 8.41 + bias * 0.005,
            "s_17": 393.0 + bias * 0.2,
            "s_20": 38.9 - bias * 0.02,
            "s_21": 23.3 - bias * 0.03
        })

    res = predictor.predict_component_health(degraded_cycles, mission_window_hours=48.0)
    assert res["predicted_rul"] < 80.0
    assert res["risk_level"] in ["MEDIUM", "HIGH", "CRITICAL"]


def test_verified_model_metadata(predictor):
    """Verifies that model metadata contains expected feature columns and versioning."""
    assert len(predictor.expected_features) > 10
    assert "s_3_roll_mean_5" in predictor.expected_features or "s_3" in predictor.expected_features
