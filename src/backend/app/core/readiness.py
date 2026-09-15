"""
Fleet & Asset Mission Readiness Computation Engine.
Implements military standard FMC (Fully Mission Capable), PMC (Partially Mission Capable),
and NMC (Non-Mission Capable) evaluation based on HUMS telemetry, ML RUL forecasts,
subsystem criticality, and active maintenance state.
"""

from typing import Dict, List, Any, Tuple, Optional
import logging

logger = logging.getLogger("ReadinessEngine")

# Subsystem mission-criticality weights
COMPONENT_CRITICALITY_WEIGHTS = {
    "TURBOFAN_ENGINE": 1.0,    # Flight critical (loss causes hull loss)
    "ROTOR_GEARBOX": 1.0,      # Flight critical
    "HYDRAULIC_ACTUATOR": 0.85,# Flight control critical
    "AVIONICS_RADAR": 0.65,    # Mission critical (combat degraded)
    "FUEL_PUMP": 0.90,         # Propulsion critical
}


def classify_readiness_score(score: float, has_critical_failure: bool = False) -> str:
    """
    Classifies readiness score into standard military readiness tier:
    - FMC: >= 85.0% (and no critical flight failure)
    - PMC: 50.0% to 84.99% (or non-flight-critical degradation)
    - NMC: < 50.0% (or flight-critical component failure)
    """
    if has_critical_failure or score < 50.0:
        return "NMC"
    elif score < 85.0:
        return "PMC"
    else:
        return "FMC"


def calculate_asset_readiness(
    components: List[Dict[str, Any]],
    total_flight_hours: float = 0.0,
    mission_window_hours: float = 48.0,
    in_maintenance: bool = False
) -> Dict[str, Any]:
    """
    Computes condition-based readiness score and classification for a single military asset.
    Distinguishes flight-critical subsystem failures (which trigger NMC) from secondary
    subsystem degradation (which triggers PMC without grounding the platform).
    If an asset is undergoing active maintenance (in_maintenance=True), it is temporarily NMC.
    """
    if not components:
        base_status = "NMC" if in_maintenance else "FMC"
        base_score = 40.0 if in_maintenance else 100.0
        return {
            "status": base_status,
            "readiness_score": base_score,
            "critical_issues": [{"issue": "Active depot maintenance in progress", "severity": "CRITICAL"}] if in_maintenance else [],
            "warnings": [],
            "mission_capable": not in_maintenance,
            "evaluated_components_count": 0,
            "in_maintenance": in_maintenance
        }

    penalty = 0.0
    critical_issues = []
    warnings = []
    has_critical_flight_component_failure = False

    for comp in components:
        comp_type = comp.get("component_type", "UNKNOWN")
        weight = COMPONENT_CRITICALITY_WEIGHTS.get(comp_type, 0.70)
        risk = str(comp.get("risk_level", "LOW")).upper()
        rul = float(comp.get("current_rul", 125.0))
        fails_before_mission = comp.get("fails_before_mission", False) or (rul <= mission_window_hours)
        is_flight_critical = weight >= 0.85

        if risk == "CRITICAL" or (fails_before_mission and is_flight_critical):
            penalty += 45.0 * weight
            critical_issues.append({
                "component_id": comp.get("id"),
                "component_name": comp.get("name"),
                "component_type": comp_type,
                "issue": f"Predicted RUL ({rul:.1f} hrs) fails before mission window ({mission_window_hours:.1f} hrs). Imminent failure risk.",
                "severity": "CRITICAL",
                "is_flight_critical": is_flight_critical
            })
            if is_flight_critical:
                has_critical_flight_component_failure = True

        elif risk == "HIGH":
            penalty += 25.0 * weight
            warnings.append({
                "component_id": comp.get("id"),
                "component_name": comp.get("name"),
                "component_type": comp_type,
                "issue": f"High degradation rate detected with RUL ({rul:.1f} hrs). Maintenance required soon.",
                "severity": "HIGH",
                "is_flight_critical": is_flight_critical
            })

        elif risk == "MEDIUM":
            penalty += 12.0 * weight
            warnings.append({
                "component_id": comp.get("id"),
                "component_name": comp.get("name"),
                "component_type": comp_type,
                "issue": f"Subsystem showing mild telemetry drift (RUL {rul:.1f} hrs).",
                "severity": "MEDIUM",
                "is_flight_critical": is_flight_critical
            })
        elif fails_before_mission and not is_flight_critical:
            # Secondary component fails before mission window: penalty applied, warnings logged
            penalty += 20.0 * weight
            warnings.append({
                "component_id": comp.get("id"),
                "component_name": comp.get("name"),
                "component_type": comp_type,
                "issue": f"Secondary subsystem RUL ({rul:.1f} hrs) within mission window ({mission_window_hours:.1f} hrs). Combat degraded.",
                "severity": "WARNING",
                "is_flight_critical": False
            })

    # Base readiness score: strictly clamped [0.0, 100.0]
    readiness_score = max(0.0, min(100.0, round(100.0 - penalty, 1)))

    # If maintenance is actively in progress, airframe cannot fly
    if in_maintenance:
        has_critical_flight_component_failure = True
        readiness_score = min(readiness_score, 45.0)
        critical_issues.append({
            "component_id": None,
            "component_name": "Airframe",
            "component_type": "MAINTENANCE",
            "issue": "Platform currently undergoing active turnaround maintenance; grounded until post-overhaul run-up.",
            "severity": "CRITICAL",
            "is_flight_critical": True
        })

    # Military standard classification with boundary precision
    status = classify_readiness_score(readiness_score, has_critical_failure=has_critical_flight_component_failure)
    mission_capable = (status == "FMC" and not in_maintenance)

    return {
        "status": status,
        "readiness_score": readiness_score,
        "critical_issues": critical_issues,
        "warnings": warnings,
        "mission_capable": mission_capable,
        "evaluated_components_count": len(components),
        "has_critical_flight_component_failure": has_critical_flight_component_failure,
        "in_maintenance": in_maintenance
    }


def calculate_fleet_readiness_summary(assets_with_components: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes fleet-wide readiness aggregation: FMC/PMC/NMC counts, percentages,
    and identifies high-risk platforms requiring command intervention.
    """
    total = len(assets_with_components)
    if total == 0:
        return {
            "total_assets": 0,
            "fmc_count": 0,
            "pmc_count": 0,
            "nmc_count": 0,
            "fleet_readiness_rate": 100.0,
            "critical_attention_required": []
        }

    fmc_cnt = 0
    pmc_cnt = 0
    nmc_cnt = 0
    total_score = 0.0
    critical_attention = []

    for asset_data in assets_with_components:
        in_maint = asset_data.get("in_maintenance", False) or (asset_data.get("status") == "IN_MAINTENANCE")
        res = calculate_asset_readiness(asset_data.get("components", []), in_maintenance=in_maint)
        st = res["status"]
        score = res["readiness_score"]
        total_score += score

        if st == "FMC":
            fmc_cnt += 1
        elif st == "PMC":
            pmc_cnt += 1
            if res["critical_issues"] or score < 75.0:
                critical_attention.append({
                    "asset_id": asset_data.get("id"),
                    "asset_code": asset_data.get("asset_code"),
                    "name": asset_data.get("name"),
                    "status": st,
                    "readiness_score": score,
                    "issues": res["critical_issues"]
                })
        else:
            nmc_cnt += 1
            critical_attention.append({
                "asset_id": asset_data.get("id"),
                "asset_code": asset_data.get("asset_code"),
                "name": asset_data.get("name"),
                "status": st,
                "readiness_score": score,
                "issues": res["critical_issues"]
            })

    avg_score = round(total_score / total, 1)
    fmc_rate = round((fmc_cnt / total) * 100.0, 1)

    return {
        "total_assets": total,
        "fmc_count": fmc_cnt,
        "pmc_count": pmc_cnt,
        "nmc_count": nmc_cnt,
        "fmc_percentage": fmc_rate,
        "fleet_readiness_average": avg_score,
        "mission_ready_rate": fmc_rate,
        "critical_attention_count": len(critical_attention),
        "critical_attention_required": critical_attention
    }


def evaluate_mission_window_risk(
    asset_data: Dict[str, Any],
    components: List[Dict[str, Any]],
    mission_window_hours: float,
    mission_start_hours: float = 0.0,
    required_capabilities: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Evaluates mission execution risk by combining component RUL, mission start time,
    mission duration, and required operational capabilities.

    Handles explicit operational cases:
    - CASE A: RUL comfortably exceeds mission requirement -> No mission conflict.
    - CASE B: RUL falls before mission completion -> Mission conflict (in-sortie failure risk).
    - CASE C: RUL expires before mission starts -> Critical mission conflict (pre-launch failure).
    - CASE D: Asset degraded (PMC) but mission-compatible -> Cleared for mission with restrictions.
    - CASE E: Flight-critical component failure / NMC -> Mission unavailable.
    """
    in_maint = asset_data.get("in_maintenance", False) or (asset_data.get("status") == "IN_MAINTENANCE")
    readiness = calculate_asset_readiness(components, mission_window_hours=mission_window_hours, in_maintenance=in_maint)
    total_mission_horizon = mission_start_hours + mission_window_hours

    # Identify individual component failure timings
    pre_launch_failures = []
    in_sortie_failures = []
    secondary_degraded = []

    for comp in components:
        comp_type = comp.get("component_type", "UNKNOWN")
        rul = float(comp.get("current_rul", 125.0))
        weight = COMPONENT_CRITICALITY_WEIGHTS.get(comp_type, 0.70)
        is_flight_critical = weight >= 0.85

        if rul <= mission_start_hours:
            pre_launch_failures.append({
                "component_name": comp.get("name"),
                "component_type": comp_type,
                "current_rul": rul,
                "is_flight_critical": is_flight_critical
            })
        elif rul <= total_mission_horizon:
            in_sortie_failures.append({
                "component_name": comp.get("name"),
                "component_type": comp_type,
                "current_rul": rul,
                "is_flight_critical": is_flight_critical
            })
        elif comp.get("risk_level", "LOW") in ["HIGH", "CRITICAL"]:
            secondary_degraded.append({
                "component_name": comp.get("name"),
                "component_type": comp_type,
                "current_rul": rul
            })

    # Case Evaluation Logic:

    # CASE C: RUL expires before or at mission start
    if pre_launch_failures:
        return {
            "case": "CASE_C",
            "risk_verdict": "CRITICAL_MISSION_CONFLICT",
            "mission_at_risk": True,
            "can_execute_mission": False,
            "conflict_type": "PRE_LAUNCH_FAILURE",
            "explanation": f"Component(s) {', '.join(f['component_name'] for f in pre_launch_failures)} will expire before or at mission start ({mission_start_hours:.1f}h). Pre-launch grounding.",
            "readiness_status": readiness["status"],
            "readiness_score": readiness["readiness_score"],
            "pre_launch_failures": pre_launch_failures,
            "in_sortie_failures": in_sortie_failures
        }

    # CASE E: Flight-critical component makes mission impossible
    if readiness["has_critical_flight_component_failure"] or readiness["status"] == "NMC":
        return {
            "case": "CASE_E",
            "risk_verdict": "MISSION_UNAVAILABLE",
            "mission_at_risk": True,
            "can_execute_mission": False,
            "conflict_type": "FLIGHT_CRITICAL_FAILURE",
            "explanation": "Platform is Non-Mission Capable (NMC) due to flight-critical component failure or active maintenance. Cannot be committed to operational window.",
            "readiness_status": "NMC",
            "readiness_score": readiness["readiness_score"],
            "pre_launch_failures": pre_launch_failures,
            "in_sortie_failures": in_sortie_failures
        }

    # CASE B: RUL falls before mission completion
    if in_sortie_failures:
        return {
            "case": "CASE_B",
            "risk_verdict": "MISSION_CONFLICT",
            "mission_at_risk": True,
            "can_execute_mission": False,
            "conflict_type": "IN_SORTIE_FAILURE",
            "explanation": f"Subsystem failure predicted during mission execution ({', '.join(f['component_name'] for f in in_sortie_failures)}). Sortie abort risk.",
            "readiness_status": readiness["status"],
            "readiness_score": readiness["readiness_score"],
            "pre_launch_failures": pre_launch_failures,
            "in_sortie_failures": in_sortie_failures
        }

    # CASE D: Asset degraded (PMC) but mission-compatible
    if readiness["status"] == "PMC":
        # Check if any required capability is degraded
        unmet_capabilities = []
        if required_capabilities:
            for cap in required_capabilities:
                for comp in components:
                    if comp.get("component_type") == cap and comp.get("risk_level") in ["HIGH", "CRITICAL"]:
                        unmet_capabilities.append(cap)

        if not unmet_capabilities:
            return {
                "case": "CASE_D",
                "risk_verdict": "DEGRADED_CAPABLE",
                "mission_at_risk": False,
                "can_execute_mission": True,
                "conflict_type": "NONE",
                "explanation": "Asset is Partially Mission Capable (PMC). Secondary systems degraded, but primary required flight subsystems meet mission threshold.",
                "readiness_status": "PMC",
                "readiness_score": readiness["readiness_score"],
                "pre_launch_failures": [],
                "in_sortie_failures": []
            }
        else:
            return {
                "case": "CASE_D_RESTRICTED",
                "risk_verdict": "MISSION_CONFLICT",
                "mission_at_risk": True,
                "can_execute_mission": False,
                "conflict_type": "CAPABILITY_MISMATCH",
                "explanation": f"Asset PMC status conflicts with required mission capabilities: {', '.join(unmet_capabilities)}.",
                "readiness_status": "PMC",
                "readiness_score": readiness["readiness_score"],
                "pre_launch_failures": [],
                "in_sortie_failures": []
            }

    # CASE A: RUL comfortably exceeds mission requirement
    return {
        "case": "CASE_A",
        "risk_verdict": "NO_CONFLICT",
        "mission_at_risk": False,
        "can_execute_mission": True,
        "conflict_type": "NONE",
        "explanation": f"All subsystems have RUL comfortably exceeding mission duration ({mission_window_hours:.1f} hrs) with adequate safety margins.",
        "readiness_status": "FMC",
        "readiness_score": readiness["readiness_score"],
        "pre_launch_failures": [],
        "in_sortie_failures": []
    }
