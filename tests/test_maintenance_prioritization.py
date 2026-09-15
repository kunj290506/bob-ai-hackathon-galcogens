"""
Unit Tests for Maintenance Prioritization & Turnaround Scheduling.
Verifies multi-factor optimization ranking, explainable operational reasons,
and technician dispatch scheduling.
"""

from datetime import datetime, timedelta
import pytest
from src.backend.app.core.planner import (
    prioritize_work_orders,
    generate_recommended_maintenance_schedule
)


def test_prioritize_work_orders_ranking_and_explainability():
    """
    Verifies that work orders are ranked by composite urgency and component criticality,
    with explainable reasons populated.
    """
    now = datetime.utcnow()
    missions = [
        {
            "id": 1,
            "title": "Operation Iron Shield",
            "priority": "CRITICAL",
            "start_time": (now + timedelta(hours=36)).isoformat()
        }
    ]

    orders = [
        {
            "id": 101,
            "asset_code": "F16-VIPER-101",
            "title": "Turbofan Blade Erosion & Vibration Overhaul",
            "component_type": "TURBOFAN_ENGINE",
            "priority": "CRITICAL",
            "estimated_hours": 6.0,
            "predicted_rul": 18.4,
            "required_parts": '["NSN-2840-01-450-9921"]',
            "status": "PENDING"
        },
        {
            "id": 102,
            "asset_code": "F16-VIPER-102",
            "title": "Radar Processor Recalibration",
            "component_type": "AVIONICS_RADAR",
            "priority": "MEDIUM",
            "estimated_hours": 3.0,
            "predicted_rul": 45.0,
            "required_parts": '[]',
            "status": "PENDING"
        },
        {
            "id": 103,
            "asset_code": "A10-WARTHOG-201",
            "title": "Hydraulic Actuator Seal Replacement",
            "component_type": "HYDRAULIC_ACTUATOR",
            "priority": "HIGH",
            "estimated_hours": 4.0,
            "predicted_rul": 30.0,
            "required_parts": '["NSN-1650-00-987-1234"]',
            "status": "PENDING"
        }
    ]

    prioritized = prioritize_work_orders(orders, missions)
    assert len(prioritized) == 3

    # Priority 1 must be the Turbofan critical order
    top = prioritized[0]
    assert top["id"] == 101
    assert top["optimization_score"] > prioritized[1]["optimization_score"]
    assert top["can_complete_before_mission"] is True

    # Explainable reasons list must be present and detailed
    assert "priority_reasons" in top
    assert len(top["priority_reasons"]) >= 4
    reasons_text = " ".join(top["priority_reasons"])
    assert "TURBOFAN_ENGINE" in reasons_text or "Turbofan" in reasons_text
    assert "CRITICAL" in reasons_text
    assert "Operation Iron Shield" in reasons_text


def test_turnaround_schedule_generation():
    """Verifies that maintenance tasks are scheduled sequentially and verify mission windows."""
    unready = [
        {
            "asset_code": "F16-VIPER-101",
            "name": "Viper 101",
            "issues": [
                {"component_name": "Turbofan Engine", "severity": "CRITICAL", "issue": "Severe vibration"}
            ]
        },
        {
            "asset_code": "A10-WARTHOG-201",
            "name": "Warthog 201",
            "issues": [
                {"component_name": "Hydraulic System", "severity": "HIGH", "issue": "Actuator pressure drop"}
            ]
        }
    ]

    techs = ["Sgt. Miller", "Tech. Chen"]
    sched = generate_recommended_maintenance_schedule(unready, techs, mission_window_hours=48.0)

    assert sched["scheduled_tasks_count"] == 2
    assert sched["total_work_hours"] == 10.0  # 6.0 + 4.0
    assert sched["all_assets_recoverable_in_window"] is True
    assert sched["schedule"][0]["assigned_technician"] == "Sgt. Miller"
    assert sched["schedule"][1]["assigned_technician"] == "Tech. Chen"
