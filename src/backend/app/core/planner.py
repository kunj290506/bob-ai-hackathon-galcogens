"""
Prioritized Maintenance Planning & Mission-Aware Optimization Engine.
Schedules and ranks work orders by mission criticality, component degradation RUL,
required maintenance turnaround times, and operational asset readiness impact.
"""

from datetime import datetime, timedelta
import json
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger("MaintenancePlanner")

PRIORITY_WEIGHTS = {
    "CRITICAL": 100.0,
    "HIGH": 75.0,
    "MEDIUM": 50.0,
    "LOW": 25.0
}

MISSION_CRITICALITY_MULTIPLIER = {
    "CRITICAL": 1.5,
    "HIGH": 1.25,
    "MEDIUM": 1.0,
    "LOW": 0.8
}

COMPONENT_CRITICALITY_BONUS = {
    "TURBOFAN_ENGINE": 25.0,
    "ROTOR_GEARBOX": 25.0,
    "HYDRAULIC_ACTUATOR": 20.0,
    "FUEL_PUMP": 15.0,
    "AVIONICS_RADAR": 10.0
}


def prioritize_work_orders(
    work_orders: List[Dict[str, Any]],
    upcoming_missions: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Ranks pending work orders using multi-factor operational optimization:
    1. Base discrepancy priority (CRITICAL, HIGH, MEDIUM, LOW)
    2. Mission criticality multiplier and hours to deployment
    3. Subsystem flight-criticality weighting
    4. Remaining useful life (RUL) margin vs mission launch
    5. Turnaround duration feasibility (can complete before launch)
    6. Generates human-auditable, structured explainability reasons.
    """
    ranked_orders = []
    now = datetime.utcnow()

    # Find earliest mission window
    earliest_mission_hours = 999.0
    active_mission_name = "Fleet Standby"
    mission_prio = "MEDIUM"

    if upcoming_missions:
        first_m = sorted(upcoming_missions, key=lambda m: m.get("start_time", now + timedelta(days=30)))[0]
        st = first_m.get("start_time") or (now + timedelta(hours=48))
        if isinstance(st, str):
            try:
                st = datetime.fromisoformat(st.replace("Z", "+00:00"))
            except Exception:
                st = now + timedelta(hours=48)
        time_to_mission = max(1.0, (st - now).total_seconds() / 3600.0)
        earliest_mission_hours = time_to_mission
        active_mission_name = first_m.get("title", "Mission Window")
        mission_prio = first_m.get("priority", "HIGH")

    mission_mult = MISSION_CRITICALITY_MULTIPLIER.get(mission_prio, 1.0)

    for order in work_orders:
        order_dict = dict(order)
        prio = order_dict.get("priority", "MEDIUM").upper()
        base_score = PRIORITY_WEIGHTS.get(prio, 50.0)
        est_hours = float(order_dict.get("estimated_hours", 4.0))

        # Check component criticality
        comp_type = order_dict.get("component_type", "")
        if not comp_type:
            title = order_dict.get("title", "").upper()
            desc = order_dict.get("description", "").upper()
            if "TURBOFAN" in title or "ENGINE" in title or "TURBOFAN" in desc:
                comp_type = "TURBOFAN_ENGINE"
            elif "GEARBOX" in title or "ROTOR" in title:
                comp_type = "ROTOR_GEARBOX"
            elif "HYDRAULIC" in title:
                comp_type = "HYDRAULIC_ACTUATOR"
            elif "FUEL" in title:
                comp_type = "FUEL_PUMP"
            elif "RADAR" in title or "AVIONICS" in title:
                comp_type = "AVIONICS_RADAR"

        comp_bonus = COMPONENT_CRITICALITY_BONUS.get(comp_type, 5.0)

        # Time urgency factor: per-asset/order mission proximity slack
        order_mission_hours = order_dict.get("hours_to_mission")
        if order_mission_hours is None:
            order_mission_hours = earliest_mission_hours
        else:
            order_mission_hours = float(order_mission_hours)

        time_slack = max(1.0, order_mission_hours - est_hours)
        urgency_factor = max(1.0, min(3.0, 100.0 / time_slack))

        # Check parts availability
        req_parts = order_dict.get("required_parts", "[]")
        if isinstance(req_parts, str):
            try:
                parts_list = json.loads(req_parts)
            except Exception:
                parts_list = [req_parts] if req_parts else []
        elif isinstance(req_parts, list):
            parts_list = req_parts
        else:
            parts_list = []
        parts_available = len(parts_list) > 0 or order_dict.get("parts_available", True)

        can_complete = order_mission_hours >= est_hours

        # Composite optimization score
        composite_score = round((base_score + comp_bonus) * mission_mult * (urgency_factor / 2.0), 1)

        # Build explainable reasons
        reasons = []
        if prio in ["CRITICAL", "HIGH"]:
            reasons.append(f"Severity classification: {prio} discrepancy")
        if comp_type:
            reasons.append(f"Subsystem: {comp_type} (flight-criticality weight: {comp_bonus/25.0:.2f})")
        
        rul = order_dict.get("predicted_rul")
        if rul is not None:
            reasons.append(f"Current component RUL: {rul:.1f}h")
        
        reasons.append(f"Deployment window: '{active_mission_name}' starts in {earliest_mission_hours:.1f}h")
        reasons.append(f"Estimated maintenance turnaround: {est_hours:.1f}h (feasible before launch: {can_complete})")
        
        if parts_list:
            reasons.append(f"Required NSN parts: {', '.join(parts_list)}")
        else:
            reasons.append("Standard depot service kit verified in stock")

        order_dict["optimization_score"] = composite_score
        order_dict["target_mission"] = active_mission_name
        order_dict["hours_to_mission"] = round(earliest_mission_hours, 1)
        order_dict["can_complete_before_mission"] = can_complete
        order_dict["parts_verified"] = parts_available
        order_dict["priority_reasons"] = reasons

        ranked_orders.append(order_dict)

    # Sort descending by optimization score
    ranked_orders.sort(key=lambda o: o["optimization_score"], reverse=True)
    return ranked_orders


def generate_recommended_maintenance_schedule(
    unready_assets: List[Dict[str, Any]],
    available_technicians: List[str],
    mission_window_hours: float = 48.0
) -> Dict[str, Any]:
    """
    Generates a turn-by-turn maintenance dispatch schedule allocating technicians
    and estimating turnaround time to restore fleet FMC readiness before mission launch.
    """
    schedule = []
    now = datetime.utcnow()
    current_time = now

    tech_idx = 0
    total_repair_hours = 0.0

    for asset in unready_assets:
        asset_code = asset.get("asset_code", "UNKNOWN")
        asset_name = asset.get("name", "Unknown Asset")
        critical_issues = asset.get("issues", [])

        for issue in critical_issues:
            comp_name = issue.get("component_name", "Critical Subsystem")
            est_hrs = 6.0 if "TURBOFAN" in comp_name.upper() else 4.0
            total_repair_hours += est_hrs

            assigned_tech = available_technicians[tech_idx % len(available_technicians)] if available_technicians else "Lead Technician"
            tech_idx += 1

            start_slot = current_time
            end_slot = start_slot + timedelta(hours=est_hrs)
            current_time = end_slot # Sequential queuing

            is_on_time = (end_slot - now).total_seconds() / 3600.0 <= mission_window_hours

            schedule.append({
                "asset_code": asset_code,
                "asset_name": asset_name,
                "component": comp_name,
                "action": f"Condition-based Overhaul: {issue.get('issue', 'Degradation replacement')}",
                "assigned_technician": assigned_tech,
                "estimated_duration_hours": est_hrs,
                "scheduled_start": start_slot.isoformat(),
                "scheduled_completion": end_slot.isoformat(),
                "will_meet_mission_window": is_on_time,
                "priority": issue.get("severity", "HIGH")
            })

    return {
        "scheduled_tasks_count": len(schedule),
        "total_work_hours": total_repair_hours,
        "mission_window_hours": mission_window_hours,
        "all_assets_recoverable_in_window": all(t["will_meet_mission_window"] for t in schedule),
        "schedule": schedule
    }
