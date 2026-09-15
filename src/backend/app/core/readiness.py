"""
Fleet & Asset Mission Readiness Computation Engine.
Implements military standard FMC (Fully Mission Capable), PMC (Partially Mission Capable),
and NMC (Non-Mission Capable) evaluation based on HUMS telemetry, ML RUL forecasts,
and subsystem criticality.
"""

from typing import Dict, List, Any, Tuple
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


def calculate_asset_readiness(
    components: List[Dict[str, Any]],
    total_flight_hours: float = 0.0,
    mission_window_hours: float = 48.0
) -> Dict[str, Any]:
    """
    Computes condition-based readiness score and classification for a single military asset.
    """
    if not components:
        return {
            "status": "FMC",
            "readiness_score": 100.0,
            "critical_issues": [],
            "warnings": [],
            "mission_capable": True
        }

    penalty = 0.0
    critical_issues = []
    warnings = []
    has_critical_flight_component_failure = False

    for comp in components:
        comp_type = comp.get("component_type", "UNKNOWN")
        weight = COMPONENT_CRITICALITY_WEIGHTS.get(comp_type, 0.7)
        risk = comp.get("risk_level", "LOW").upper()
        rul = comp.get("current_rul", 125.0)
        fails_before_mission = comp.get("fails_before_mission", False) or (rul <= mission_window_hours)

        if risk == "CRITICAL" or (fails_before_mission and weight >= 0.85):
            penalty += 45.0 * weight
            critical_issues.append({
                "component_id": comp.get("id"),
                "component_name": comp.get("name"),
                "issue": f"Predicted RUL ({rul:.1f} hrs) fails before mission window ({mission_window_hours:.1f} hrs). Imminent catastrophic degradation.",
                "severity": "CRITICAL"
            })
            if weight >= 0.85:
                has_critical_flight_component_failure = True

        elif risk == "HIGH":
            penalty += 25.0 * weight
            warnings.append({
                "component_id": comp.get("id"),
                "component_name": comp.get("name"),
                "issue": f"High degradation rate detected with RUL ({rul:.1f} hrs). Maintenance required soon.",
                "severity": "HIGH"
            })

        elif risk == "MEDIUM":
            penalty += 12.0 * weight
            warnings.append({
                "component_id": comp.get("id"),
                "component_name": comp.get("name"),
                "issue": f"Subsystem showing mild telemetry drift (RUL {rul:.1f} hrs).",
                "severity": "MEDIUM"
            })

    # Base readiness score
    readiness_score = max(0.0, min(100.0, round(100.0 - penalty, 1)))

    # Classification
    if has_critical_flight_component_failure or readiness_score < 50.0:
        status = "NMC"  # Non-Mission Capable
        mission_capable = False
    elif readiness_score < 85.0 or len(critical_issues) > 0:
        status = "PMC"  # Partially Mission Capable
        mission_capable = False
    else:
        status = "FMC"  # Fully Mission Capable
        mission_capable = True

    return {
        "status": status,
        "readiness_score": readiness_score,
        "critical_issues": critical_issues,
        "warnings": warnings,
        "mission_capable": mission_capable,
        "evaluated_components_count": len(components)
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
        res = calculate_asset_readiness(asset_data.get("components", []))
        st = res["status"]
        score = res["readiness_score"]
        total_score += score

        if st == "FMC":
            fmc_cnt += 1
        elif st == "PMC":
            pmc_cnt += 1
            if res["critical_issues"]:
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
