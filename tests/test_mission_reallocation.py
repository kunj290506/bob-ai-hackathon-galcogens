"""
Unit Tests for Mission-Adaptive Sortie Reallocation & Substitution Engine.
Verifies operational cases:
1. Primary asset available.
2. Primary asset unavailable.
3. One valid alternative.
4. Multiple alternatives ranked by operational composite score.
5. No valid alternative (mission grounded).
"""

import pytest
from src.backend.app.core.mission_matching import (
    reallocate_mission_sortie,
    match_asset_to_sortie_profiles,
    SORTIE_PROFILES
)


def test_primary_asset_available_and_capable():
    """Case 1: Primary platform is available and satisfies profile requirements."""
    primary = {
        "asset_code": "F16-VIPER-101",
        "name": "Viper 101",
        "status": "FMC",
        "is_available": True,
        "in_maintenance": False,
        "lowest_component_rul": 65.0,
        "has_critical_flight_component_failure": False
    }

    candidates = [
        {"asset_code": "F16-VIPER-102", "name": "Viper 102", "status": "FMC", "lowest_component_rul": 60.0}
    ]

    res = reallocate_mission_sortie(
        primary_asset=primary,
        candidate_assets=candidates,
        required_profile_code="CAP_HEAVY",
        mission_duration_hours=6.0
    )

    assert res["verdict"] == "PRIMARY_ASSIGNED"
    assert res["selected_asset_code"] == "F16-VIPER-101"
    assert res["is_alternative"] is False
    assert "Primary asset F16-VIPER-101 is fully available" in res["explanation"]


def test_primary_unavailable_one_valid_alternative():
    """Case 2 & 3: Primary platform is NMC; exactly one valid alternative exists."""
    primary = {
        "asset_code": "F16-VIPER-101",
        "name": "Viper 101",
        "status": "NMC",
        "is_available": False,
        "in_maintenance": True,
        "lowest_component_rul": 12.0,
        "has_critical_flight_component_failure": True
    }

    candidates = [
        {
            "asset_code": "F16-VIPER-102",
            "name": "Viper 102",
            "status": "FMC",
            "is_available": True,
            "in_maintenance": False,
            "lowest_component_rul": 75.0,
            "readiness_score": 96.0,
            "has_critical_flight_component_failure": False
        },
        {
            "asset_code": "F16-VIPER-103",
            "name": "Viper 103",
            "status": "NMC",
            "is_available": True,
            "in_maintenance": False,
            "lowest_component_rul": 15.0,
            "readiness_score": 45.0,
            "has_critical_flight_component_failure": True
        }
    ]

    res = reallocate_mission_sortie(
        primary_asset=primary,
        candidate_assets=candidates,
        required_profile_code="CAP_HEAVY",
        mission_duration_hours=6.0
    )

    assert res["verdict"] == "ALTERNATIVE_ASSIGNED"
    assert res["selected_asset_code"] == "F16-VIPER-102"
    assert res["is_alternative"] is True
    assert res["qualified_candidates_count"] == 1
    assert "SOLE ALTERNATIVE" in res["explanation"]


def test_primary_unavailable_multiple_alternatives_ranked():
    """Case 4: Multiple alternatives; engine selects optimal platform based on composite ranking."""
    primary = {
        "asset_code": "F16-VIPER-101",
        "name": "Viper 101",
        "status": "NMC",
        "is_available": True,
        "in_maintenance": False,
        "lowest_component_rul": 10.0,
        "has_critical_flight_component_failure": True
    }

    candidates = [
        {
            "asset_code": "F16-VIPER-102",
            "name": "Viper 102",
            "status": "FMC",
            "is_available": True,
            "lowest_component_rul": 55.0,  # margin: 55 - 51 = 4h
            "readiness_score": 88.0,
            "has_critical_flight_component_failure": False
        },
        {
            "asset_code": "F16-VIPER-103",
            "name": "Viper 103",
            "status": "FMC",
            "is_available": True,
            "lowest_component_rul": 95.0,  # margin: 95 - 51 = 44h (superior RUL margin)
            "readiness_score": 98.0,
            "has_critical_flight_component_failure": False
        }
    ]

    res = reallocate_mission_sortie(
        primary_asset=primary,
        candidate_assets=candidates,
        required_profile_code="CAP_HEAVY",
        mission_duration_hours=6.0
    )

    assert res["verdict"] == "ALTERNATIVE_ASSIGNED"
    assert res["selected_asset_code"] == "F16-VIPER-103"
    assert res["qualified_candidates_count"] == 2
    assert "OPTIMAL ALTERNATIVE" in res["explanation"]


def test_primary_unavailable_no_valid_alternative():
    """Case 5: All alternatives disqualified -> Mission grounded with explanation."""
    primary = {
        "asset_code": "F16-VIPER-101",
        "status": "NMC",
        "is_available": False,
        "lowest_component_rul": 5.0,
        "has_critical_flight_component_failure": True
    }

    candidates = [
        {
            "asset_code": "F16-VIPER-102",
            "status": "PMC",  # Prohibited for CAP_HEAVY which requires FMC
            "is_available": True,
            "lowest_component_rul": 55.0,
            "has_critical_flight_component_failure": False
        },
        {
            "asset_code": "F16-VIPER-103",
            "status": "FMC",
            "is_available": True,
            "lowest_component_rul": 30.0,  # Below required 51.0h (45 + 6)
            "has_critical_flight_component_failure": False
        }
    ]

    res = reallocate_mission_sortie(
        primary_asset=primary,
        candidate_assets=candidates,
        required_profile_code="CAP_HEAVY",
        mission_duration_hours=6.0
    )

    assert res["verdict"] == "NO_ALTERNATIVE_AVAILABLE"
    assert res["selected_asset_code"] is None
    assert len(res["disqualified_candidates"]) == 2
    assert "SORTIE ABORT" in res["explanation"]
