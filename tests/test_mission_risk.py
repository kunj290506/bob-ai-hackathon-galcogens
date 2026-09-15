"""
Unit Tests for Mission-Window Risk Evaluation Engine.
Verifies Cases A through E:
- CASE A: RUL comfortably exceeds mission requirement -> No conflict.
- CASE B: RUL falls before mission completion -> Mission conflict (in-sortie failure).
- CASE C: RUL expires before mission starts -> Critical mission conflict (pre-launch failure).
- CASE D: Asset degraded (PMC) but mission-compatible -> Cleared for mission with restrictions.
- CASE E: Flight-critical component failure -> NMC / mission unavailable.
"""

import pytest
from src.backend.app.core.readiness import evaluate_mission_window_risk


def test_case_a_rul_comfortably_exceeds_mission_window():
    """CASE A: RUL comfortably exceeds mission requirement -> No mission conflict."""
    asset = {"asset_code": "F16-VIPER-101", "name": "Viper 101", "status": "FMC"}
    components = [
        {"component_type": "TURBOFAN_ENGINE", "name": "Turbofan", "current_rul": 120.0, "risk_level": "LOW"},
        {"component_type": "HYDRAULIC_ACTUATOR", "name": "Hydraulics", "current_rul": 95.0, "risk_level": "LOW"}
    ]

    res = evaluate_mission_window_risk(
        asset_data=asset,
        components=components,
        mission_window_hours=24.0,
        mission_start_hours=12.0
    )

    assert res["case"] == "CASE_A"
    assert res["risk_verdict"] == "NO_CONFLICT"
    assert res["mission_at_risk"] is False
    assert res["can_execute_mission"] is True


def test_case_b_rul_falls_before_mission_completion():
    """CASE B: RUL expires during the mission window -> In-sortie failure risk."""
    asset = {"asset_code": "F16-VIPER-102", "name": "Viper 102", "status": "FMC"}
    # Mission starts in 10h, lasts 20h (total horizon 30h). Component RUL is 22h -> fails in-sortie!
    components = [
        {"component_type": "TURBOFAN_ENGINE", "name": "Turbofan", "current_rul": 22.0, "risk_level": "HIGH"},
        {"component_type": "HYDRAULIC_ACTUATOR", "name": "Hydraulics", "current_rul": 95.0, "risk_level": "LOW"}
    ]

    res = evaluate_mission_window_risk(
        asset_data=asset,
        components=components,
        mission_window_hours=20.0,
        mission_start_hours=10.0
    )

    assert res["case"] == "CASE_B"
    assert res["risk_verdict"] == "MISSION_CONFLICT"
    assert res["conflict_type"] == "IN_SORTIE_FAILURE"
    assert res["mission_at_risk"] is True
    assert res["can_execute_mission"] is False


def test_case_c_rul_expires_before_mission_starts():
    """CASE C: RUL expires before mission starts -> Critical pre-launch failure."""
    asset = {"asset_code": "F16-VIPER-103", "name": "Viper 103", "status": "NMC"}
    # Mission starts in 24h. Component RUL is 8h -> expires before launch!
    components = [
        {"component_type": "TURBOFAN_ENGINE", "name": "Turbofan", "current_rul": 8.0, "risk_level": "CRITICAL"},
        {"component_type": "HYDRAULIC_ACTUATOR", "name": "Hydraulics", "current_rul": 95.0, "risk_level": "LOW"}
    ]

    res = evaluate_mission_window_risk(
        asset_data=asset,
        components=components,
        mission_window_hours=12.0,
        mission_start_hours=24.0
    )

    assert res["case"] == "CASE_C"
    assert res["risk_verdict"] == "CRITICAL_MISSION_CONFLICT"
    assert res["conflict_type"] == "PRE_LAUNCH_FAILURE"
    assert res["mission_at_risk"] is True
    assert res["can_execute_mission"] is False


def test_case_d_degraded_asset_mission_compatible():
    """CASE D: Asset is PMC due to secondary radar degradation, but mission doesn't require radar -> Capable."""
    asset = {"asset_code": "F16-VIPER-104", "name": "Viper 104", "status": "PMC"}
    components = [
        {"component_type": "TURBOFAN_ENGINE", "name": "Turbofan", "current_rul": 150.0, "risk_level": "LOW"},
        {"component_type": "HYDRAULIC_ACTUATOR", "name": "Hydraulics", "current_rul": 120.0, "risk_level": "LOW"},
        {"component_type": "AVIONICS_RADAR", "name": "Radar", "current_rul": 30.0, "risk_level": "HIGH"}
    ]

    # Mission only requires propulsion and flight controls (e.g. Tactical Ferry or Transit)
    res = evaluate_mission_window_risk(
        asset_data=asset,
        components=components,
        mission_window_hours=6.0,
        mission_start_hours=2.0,
        required_capabilities=["TURBOFAN_ENGINE", "HYDRAULIC_ACTUATOR"]
    )

    assert res["case"] == "CASE_D"
    assert res["risk_verdict"] == "DEGRADED_CAPABLE"
    assert res["mission_at_risk"] is False
    assert res["can_execute_mission"] is True


def test_case_e_critical_component_failure_makes_mission_impossible():
    """CASE E: Flight-critical component failure causes NMC status -> Mission unavailable."""
    asset = {"asset_code": "F16-VIPER-105", "name": "Viper 105", "status": "NMC"}
    components = [
        {"component_type": "TURBOFAN_ENGINE", "name": "Turbofan", "current_rul": 12.0, "risk_level": "CRITICAL", "fails_before_mission": True}
    ]

    res = evaluate_mission_window_risk(
        asset_data=asset,
        components=components,
        mission_window_hours=48.0,
        mission_start_hours=0.0
    )

    assert res["case"] in ["CASE_E", "CASE_C"]
    assert res["mission_at_risk"] is True
    assert res["can_execute_mission"] is False


def test_exact_mission_window_boundaries():
    """
    Stress-tests floating point boundary conditions:
    Mission start = 10.0h, Duration = 20.0h (Mission horizon = 30.0h).
    1. RUL == 10.0h (exact mission start): must trigger PRE_LAUNCH_FAILURE (CASE_C)
    2. RUL == 30.0h (exact mission end): must trigger IN_SORTIE_FAILURE (CASE_B)
    3. RUL == 30.01h (just beyond horizon): must be cleared with NO_CONFLICT (CASE_A)
    """
    asset = {"asset_code": "F16-BOUNDARY-TEST", "name": "Boundary Test", "status": "FMC"}

    # Boundary 1: RUL == mission_start_hours (10.0) -> PRE_LAUNCH_FAILURE
    comps_at_start = [
        {"component_type": "TURBOFAN_ENGINE", "name": "Turbofan", "current_rul": 10.0, "risk_level": "CRITICAL"}
    ]
    res_start = evaluate_mission_window_risk(
        asset_data=asset,
        components=comps_at_start,
        mission_start_hours=10.0,
        mission_window_hours=20.0
    )
    assert res_start["case"] == "CASE_C"
    assert res_start["conflict_type"] == "PRE_LAUNCH_FAILURE"
    assert res_start["can_execute_mission"] is False

    # Boundary 2: RUL == mission_start + duration (30.0) -> IN_SORTIE_FAILURE
    comps_at_end = [
        {"component_type": "TURBOFAN_ENGINE", "name": "Turbofan", "current_rul": 30.0, "risk_level": "HIGH"}
    ]
    res_end = evaluate_mission_window_risk(
        asset_data=asset,
        components=comps_at_end,
        mission_start_hours=10.0,
        mission_window_hours=20.0
    )
    assert res_end["case"] == "CASE_B"
    assert res_end["conflict_type"] == "IN_SORTIE_FAILURE"
    assert res_end["can_execute_mission"] is False

    # Boundary 3: RUL == mission_start + duration + 0.01 (30.01) -> NO_CONFLICT
    comps_after_end = [
        {"component_type": "TURBOFAN_ENGINE", "name": "Turbofan", "current_rul": 30.01, "risk_level": "LOW"}
    ]
    res_after = evaluate_mission_window_risk(
        asset_data=asset,
        components=comps_after_end,
        mission_start_hours=10.0,
        mission_window_hours=20.0
    )
    assert res_after["case"] == "CASE_A"
    assert res_after["risk_verdict"] == "NO_CONFLICT"
    assert res_after["can_execute_mission"] is True
