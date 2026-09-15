"""
Prioritized Maintenance Planning & Mission-Aware Optimization Engine.
Schedules and ranks work orders by mission criticality, component degradation RUL,
and required maintenance turnaround times.
"""

from datetime import datetime, timedelta
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


def prioritize_work_orders(
    work_orders: List[Dict[str, Any]],
    upcoming_missions: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Ranks pending work orders by mission criticality and urgency.
    """
    ranked_orders = []
    now = datetime.utcnow()

    # Find earliest mission window
    earliest_mission_hours = 999.0
    active_mission_name = "None"
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

        # Time urgency factor: increases as estimated RUL approaches mission start
        est_hours = order_dict.get("estimated_hours", 4.0)
        time_slack = max(1.0, earliest_mission_hours - est_hours)
        urgency_factor = max(1.0, min(3.0, 100.0 / time_slack))

        composite_score = round(base_score * mission_mult * (urgency_factor / 2.0), 1)
        order_dict["optimization_score"] = composite_score
        order_dict["target_mission"] = active_mission_name
        order_dict["can_complete_before_mission"] = earliest_mission_hours >= est_hours

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
