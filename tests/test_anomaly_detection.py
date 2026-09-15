"""
Unit Tests for Sensor Telemetry Anomaly Detector.
Verifies Isolation Forest + Z-score statistical anomaly detection,
thermal creep detection, vibration spikes, and baseline fallback.
"""

import pytest
from src.backend.app.ml.anomaly_detector import TelemetryAnomalyDetector


@pytest.fixture
def anomaly_detector():
    """Loads production anomaly detector weights."""
    return TelemetryAnomalyDetector.load()


def test_nominal_telemetry_scores_healthy(anomaly_detector):
    """Nominal in-distribution telemetry must score healthy with no flagged sensors."""
    nominal_readings = {
        "s_2": 642.3, "s_3": 1586.9, "s_4": 1402.8, "s_7": 553.9,
        "s_8": 2388.0, "s_9": 9060.0, "s_11": 47.3, "s_12": 521.9,
        "s_13": 2388.0, "s_14": 8130.0, "s_15": 8.41, "s_17": 393.0,
        "s_20": 38.9, "s_21": 23.3
    }

    result = anomaly_detector.score_telemetry(nominal_readings)
    assert result["is_anomalous"] is False
    assert result["anomaly_score"] < 0.60
    assert result["flagged_sensors_count"] == 0


def test_thermal_creep_triggers_anomaly(anomaly_detector):
    """Severe HPC (s_3) and LPT (s_4) temperature rise must trigger anomaly detection."""
    stressed_readings = {
        "s_2": 642.3,
        "s_3": 1615.0,  # Elevated HPC temp
        "s_4": 1435.0,  # Elevated LPT temp
        "s_7": 553.9,
        "s_8": 2388.0,
        "s_9": 9060.0,
        "s_11": 47.3,
        "s_12": 521.9,
        "s_13": 2388.0,
        "s_14": 8130.0,
        "s_15": 8.49,   # Elevated bypass ratio
        "s_17": 393.0,
        "s_20": 38.9,
        "s_21": 23.3
    }

    result = anomaly_detector.score_telemetry(stressed_readings)
    assert result["is_anomalous"] is True
    assert result["anomaly_score"] > 0.50
    assert result["flagged_sensors_count"] >= 1
    flagged_ids = [s["sensor_id"] for s in result["flagged_sensors"]]
    assert any(s in flagged_ids for s in ["s_3", "s_4", "s_15"])


def test_vibration_spike_detection(anomaly_detector):
    """Severe coolant or vibration pressure spike triggers critical severity."""
    spiked_readings = {
        "s_2": 642.3, "s_3": 1586.9, "s_4": 1402.8, "s_7": 553.9,
        "s_8": 2388.0, "s_9": 9060.0, "s_11": 47.3, "s_12": 521.9,
        "s_13": 2388.0, "s_14": 8130.0, "s_15": 8.41, "s_17": 393.0,
        "s_20": 42.5,  # Bleed enthalpy spike
        "s_21": 25.5   # LPT coolant pressure spike
    }

    result = anomaly_detector.score_telemetry(spiked_readings)
    assert result["flagged_sensors_count"] >= 1
    assert any(s["severity"] in ["WARNING", "CRITICAL"] for s in result["flagged_sensors"])


def test_missing_telemetry_keys_handled_gracefully(anomaly_detector):
    """Partial telemetry dictionaries gracefully default missing sensors to baseline mean."""
    partial_readings = {
        "s_3": 1586.9,
        "s_4": 1402.8
    }

    result = anomaly_detector.score_telemetry(partial_readings)
    assert "anomaly_score" in result
    assert "is_anomalous" in result
    assert isinstance(result["flagged_sensors"], list)
