"""
Unit & Boundary Tests for Readiness Computation Engine.
Verifies military readiness semantics (FMC, PMC, NMC), boundary thresholds,
subsystem criticality weighting, and fleet-wide rollups.
"""

import pytest
from src.backend.app.core.readiness import (
    calculate_asset_readiness,
    calculate_fleet_readiness_summary,
    classify_readiness_score,
    COMPONENT_CRITICALITY_WEIGHTS
)


def test_classify_readiness_score_boundaries():
    """
    Verifies strict adherence to military readiness threshold boundaries:
    FMC >= 85.0%, PMC in [50.0%, 85.0%), NMC < 50.0%.
    """
    assert classify_readiness_score(100.0) == "FMC"
    assert classify_readiness_score(85.0) == "FMC"
    assert classify_readiness_score(84.99) == "PMC"
    assert classify_readiness_score(70.0) == "PMC"
    assert classify_readiness_score(50.0) == "PMC"
    assert classify_readiness_score(49.99) == "NMC"
    assert classify_readiness_score(0.0) == "NMC"


def test_critical_failure_forces_nmc_regardless_of_score():
    """
    A critical flight-safety failure must ground the asset (NMC)
    even if the arithmetic composite score would otherwise be above 50%.
    """
    assert classify_readiness_score(90.0, has_critical_failure=True) == "NMC"
    assert classify_readiness_score(55.0, has_critical_failure=True) == "NMC"


def test_empty_components_defaults_to_fmc():
    """An asset with no components or nominal baseline reports FMC 100%."""
    res = calculate_asset_readiness([])
    assert res["status"] == "FMC"
    assert res["readiness_score"] == 100.0
    assert res["mission_capable"] is True
    assert len(res["critical_issues"]) == 0


def test_flight_critical_component_failure_triggers_nmc():
    """
    Turbofan engine failure (weight 1.0) with RUL within mission window
    must trigger NMC status and flag has_critical_flight_component_failure.
    """
    components = [
        {
            "id": 1,
            "name": "F100-PW-229 Turbofan Engine",
            "component_type": "TURBOFAN_ENGINE",
            "current_rul": 15.0,
            "risk_level": "CRITICAL",
            "fails_before_mission": True
        },
        {
            "id": 2,
            "name": "AN/APG-68 Radar",
            "component_type": "AVIONICS_RADAR",
            "current_rul": 200.0,
            "risk_level": "LOW",
            "fails_before_mission": False
        }
    ]

    res = calculate_asset_readiness(components, mission_window_hours=48.0)
    assert res["status"] == "NMC"
    assert res["mission_capable"] is False
    assert res["has_critical_flight_component_failure"] is True
    assert len(res["critical_issues"]) >= 1


def test_secondary_subsystem_degradation_triggers_pmc_not_nmc():
    """
    Secondary subsystem degradation (e.g. Avionics Radar, weight 0.65)
    should reduce readiness to PMC without grounding the platform as NMC.
    """
    components = [
        {
            "id": 1,
            "name": "F100-PW-229 Turbofan Engine",
            "component_type": "TURBOFAN_ENGINE",
            "current_rul": 180.0,
            "risk_level": "LOW",
            "fails_before_mission": False
        },
        {
            "id": 2,
            "name": "AN/APG-68 Fire Control Radar",
            "component_type": "AVIONICS_RADAR",
            "current_rul": 35.0,
            "risk_level": "HIGH",
            "fails_before_mission": True
        }
    ]

    res = calculate_asset_readiness(components, mission_window_hours=48.0)
    # 100 - (25 * 0.65) = 83.8% -> PMC
    assert res["status"] == "PMC"
    assert res["has_critical_flight_component_failure"] is False
    assert 50.0 <= res["readiness_score"] < 85.0


def test_multiple_component_degradation_cumulative_penalty():
    """Multiple degraded subsystems must accumulate penalties deterministically."""
    components = [
        {"id": 1, "component_type": "AVIONICS_RADAR", "risk_level": "HIGH", "current_rul": 40.0},
        {"id": 2, "component_type": "HYDRAULIC_ACTUATOR", "risk_level": "MEDIUM", "current_rul": 55.0},
    ]

    res = calculate_asset_readiness(components, mission_window_hours=48.0)
    # Penalty: Radar HIGH (25 * 0.65 = 16.25) + Hydraulic MEDIUM (12 * 0.85 = 10.2) = 26.45
    # Score: 100 - 26.5 = 73.5% -> PMC
    assert res["status"] == "PMC"
    assert res["readiness_score"] == 73.5


def test_component_recovery_restores_readiness():
    """When a failed component is restored to healthy status, readiness score recovers."""
    degraded = [
        {"id": 1, "component_type": "TURBOFAN_ENGINE", "risk_level": "CRITICAL", "current_rul": 10.0}
    ]
    res_before = calculate_asset_readiness(degraded, mission_window_hours=48.0)
    assert res_before["status"] == "NMC"

    restored = [
        {"id": 1, "component_type": "TURBOFAN_ENGINE", "risk_level": "LOW", "current_rul": 150.0}
    ]
    res_after = calculate_asset_readiness(restored, mission_window_hours=48.0)
    assert res_after["status"] == "FMC"
    assert res_after["readiness_score"] == 100.0


def test_calculate_fleet_readiness_summary():
    """Fleet readiness summary accurately aggregates FMC, PMC, NMC assets and averages."""
    fleet = [
        {
            "id": 1, "asset_code": "A1", "name": "Alpha 1",
            "components": [{"component_type": "TURBOFAN_ENGINE", "risk_level": "LOW", "current_rul": 150.0}]
        },
        {
            "id": 2, "asset_code": "A2", "name": "Alpha 2",
            "components": [{"component_type": "AVIONICS_RADAR", "risk_level": "HIGH", "current_rul": 40.0}]
        },
        {
            "id": 3, "asset_code": "A3", "name": "Alpha 3",
            "components": [{"component_type": "TURBOFAN_ENGINE", "risk_level": "CRITICAL", "current_rul": 10.0}]
        }
    ]

    summary = calculate_fleet_readiness_summary(fleet)
    assert summary["total_assets"] == 3
    assert summary["fmc_count"] == 1
    assert summary["pmc_count"] == 1
    assert summary["nmc_count"] == 1
    assert summary["fmc_percentage"] == 33.3
    assert summary["critical_attention_count"] >= 1
