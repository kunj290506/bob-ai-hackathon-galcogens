"""
Deterministic End-to-End Integration Test for D1 Core Mission Readiness Lifecycle.
Validates the complete 12-stage operational pipeline:
1. Seed asset.
2. Inject/read degraded telemetry.
3. Detect anomaly.
4. Produce prediction.
5. Calculate readiness.
6. Identify mission conflict (BEFORE: Mission at risk).
7. Generate maintenance priority.
8. Create work order.
9. Approve work order.
10. Complete maintenance.
11. Recalculate readiness.
12. Verify mission status changes (AFTER: Mission readiness recovered).
"""

from datetime import datetime, timedelta
import pytest
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.backend.app.db.base import async_session_factory
from src.backend.app.db.models import Asset, Component, SensorReading, User, WorkOrder, MissionWindow, MaintenanceRecord
from src.backend.app.ml.anomaly_detector import TelemetryAnomalyDetector
from src.backend.app.ml.predictor import FleetPredictor
from src.backend.app.core.readiness import calculate_asset_readiness, evaluate_mission_window_risk
from src.backend.app.core.planner import prioritize_work_orders
from src.backend.app.api.routes.maintenance import update_work_order_status
from src.backend.app.schemas.maintenance import WorkOrderStatusUpdate


@pytest.mark.asyncio
async def test_full_mission_readiness_lifecycle_e2e():
    """
    Executes and verifies the complete closed-loop lifecycle from degradation detection
    to mission readiness recovery.
    """
    async with async_session_factory() as session:
        import uuid
        uid = uuid.uuid4().hex[:6]
        commander = User(
            username=f"commander.e2e.{uid}",
            email=f"cmd.e2e.{uid}@defense.mil",
            hashed_password="hashed_placeholder",
            full_name="Col. Marcus Vance",
            role="commander",
            unit="4th Fighter Wing",
            clearance_level="TOP_SECRET"
        )
        session.add(commander)

        asset = Asset(
            asset_code=f"F15-STRIKE-{uid}",
            name="Strike Eagle 888",
            asset_type="FIGHTER_JET",
            model="F-15E Strike Eagle",
            squadron="336th Rocketeers",
            base_location="Seymour Johnson AFB",
            status="FMC",
            readiness_score=100.0
        )
        session.add(asset)
        await session.flush()

        component = Component(
            asset_id=asset.id,
            name="F100-PW-229 Turbofan Engine",
            component_type="TURBOFAN_ENGINE",
            part_number="PN-ENG-F100",
            serial_number=f"SN-F100-E2E-{uid}",
            current_rul=150.0,
            risk_level="LOW",
            status="HEALTHY"
        )
        session.add(component)

        mission = MissionWindow(
            title="Operation Vigilant Eagle",
            description="Deep interdiction and defensive air patrol",
            mission_type="COMBAT_AIR_PATROL",
            start_time=datetime.utcnow() + timedelta(hours=36),
            end_time=datetime.utcnow() + timedelta(hours=48),
            required_assets_count=1,
            required_asset_type="FIGHTER_JET",
            priority="CRITICAL",
            minimum_readiness_threshold=85.0
        )
        session.add(mission)
        await session.commit()

        # ── STAGE 2: Inject Degraded Telemetry ─────────────────────────────────
        degraded_telemetry = []
        for cycle in range(1, 25):
            thermal_drift = cycle * 1.8
            reading = {
                "unit_nr": 1,
                "time_cycles": cycle,
                "s_2": 642.3,
                "s_3": 1586.9 + thermal_drift,  # High-Pressure Compressor Temp creep
                "s_4": 1402.8 + thermal_drift * 1.2, # LPT Exhaust Temp spike
                "s_7": 553.9,
                "s_8": 2388.0,
                "s_9": 9060.0 + thermal_drift,
                "s_11": 47.3 + cycle * 0.05,
                "s_12": 521.9,
                "s_13": 2388.0,
                "s_14": 8130.0 + thermal_drift * 0.8,
                "s_15": 8.41 + cycle * 0.006,  # Bypass ratio drift
                "s_17": 393.0,
                "s_20": 38.9,
                "s_21": 23.3
            }
            degraded_telemetry.append(reading)

        # ── STAGE 3: Detect Telemetry Anomaly ──────────────────────────────────
        detector = TelemetryAnomalyDetector.load()
        anomaly_res = detector.score_telemetry(degraded_telemetry[-1])
        assert anomaly_res["is_anomalous"] is True
        assert anomaly_res["anomaly_score"] > 0.50

        # ── STAGE 4: Produce ML RUL Prediction ─────────────────────────────────
        predictor = FleetPredictor.get_instance()
        prediction_res = predictor.predict_component_health(degraded_telemetry, mission_window_hours=48.0)
        assert prediction_res["predicted_rul"] < 40.0
        assert prediction_res["fails_before_mission"] is True
        assert prediction_res["risk_level"] in ["HIGH", "CRITICAL"]

        # Update component condition with prediction results
        component.current_rul = prediction_res["predicted_rul"]
        component.risk_level = prediction_res["risk_level"]
        component.status = "DEGRADED"

        # ── STAGE 5: Calculate Asset Readiness ─────────────────────────────────
        comps_data = [{
            "id": component.id,
            "name": component.name,
            "component_type": component.component_type,
            "current_rul": component.current_rul,
            "risk_level": component.risk_level,
            "status": component.status,
            "fails_before_mission": prediction_res["fails_before_mission"]
        }]
        readiness_before = calculate_asset_readiness(comps_data, mission_window_hours=48.0)
        assert readiness_before["status"] == "NMC"
        assert readiness_before["has_critical_flight_component_failure"] is True
        assert readiness_before["mission_capable"] is False

        asset.status = readiness_before["status"]
        asset.readiness_score = readiness_before["readiness_score"]
        await session.commit()

        # ── STAGE 6: Identify Mission Conflict (BEFORE STATE) ──────────────────
        mission_risk_before = evaluate_mission_window_risk(
            asset_data={"asset_code": asset.asset_code, "status": asset.status},
            components=comps_data,
            mission_window_hours=12.0,
            mission_start_hours=36.0
        )
        # CRITICAL ASSERTION: BEFORE INTERVENTION
        assert mission_risk_before["mission_at_risk"] is True
        assert mission_risk_before["can_execute_mission"] is False
        assert mission_risk_before["risk_verdict"] in ["CRITICAL_MISSION_CONFLICT", "MISSION_UNAVAILABLE", "MISSION_CONFLICT"]

        # ── STAGE 7: Generate Maintenance Priority ────────────────────────────
        pending_wo_data = [{
            "id": 999,
            "asset_code": asset.asset_code,
            "title": f"Condition-based Overhaul: {component.name}",
            "component_type": component.component_type,
            "priority": "CRITICAL",
            "estimated_hours": 6.0,
            "predicted_rul": component.current_rul,
            "status": "PENDING"
        }]
        upcoming_missions_data = [{
            "id": mission.id,
            "title": mission.title,
            "priority": mission.priority,
            "start_time": mission.start_time.isoformat()
        }]
        prioritized = prioritize_work_orders(pending_wo_data, upcoming_missions_data)
        assert len(prioritized) == 1
        assert prioritized[0]["can_complete_before_mission"] is True
        assert len(prioritized[0]["priority_reasons"]) >= 3

        # ── STAGE 8: Create Work Order ────────────────────────────────────────
        wo = WorkOrder(
            asset_id=asset.id,
            component_id=component.id,
            priority="CRITICAL",
            status="PENDING",
            title=f"Condition-based Overhaul: {component.name}",
            description="Turbofan thermal runaway and degradation detected.",
            estimated_hours=6.0,
            assigned_to="Master Sgt. Reynolds"
        )
        session.add(wo)
        await session.commit()
        await session.refresh(wo)
        assert wo.status == "PENDING"

        # ── STAGE 9: Approve Work Order ───────────────────────────────────────
        appr_req = WorkOrderStatusUpdate(status="APPROVED")
        wo_approved = await update_work_order_status(
            order_id=wo.id,
            req=appr_req,
            session=session,
            current_user=commander
        )
        assert wo_approved.status == "APPROVED"
        assert wo_approved.approved_by == commander.full_name

        # ── STAGE 9.5: Transition to IN_PROGRESS ──────────────────────────────
        in_prog_req = WorkOrderStatusUpdate(status="IN_PROGRESS")
        wo_in_progress = await update_work_order_status(
            order_id=wo.id,
            req=in_prog_req,
            session=session,
            current_user=commander
        )
        assert wo_in_progress.status == "IN_PROGRESS"

        # ── STAGE 10: Complete Maintenance ────────────────────────────────────
        complete_req = WorkOrderStatusUpdate(status="COMPLETED")
        wo_completed = await update_work_order_status(
            order_id=wo.id,
            req=complete_req,
            session=session,
            current_user=commander
        )
        assert wo_completed.status == "COMPLETED"

        # ── STAGE 11: Recalculate Readiness ───────────────────────────────────
        await session.refresh(asset)
        await session.refresh(component)
        assert component.status == "HEALTHY"
        assert component.risk_level == "LOW"
        assert component.current_rul >= 100.0

        # Asset is dynamically updated to FMC!
        assert asset.status == "FMC"
        assert asset.readiness_score >= 85.0

        # ── STAGE 12: Verify Mission Status Changes (AFTER STATE) ─────────────
        restored_comps_data = [{
            "id": component.id,
            "name": component.name,
            "component_type": component.component_type,
            "current_rul": component.current_rul,
            "risk_level": component.risk_level,
            "status": component.status,
            "fails_before_mission": False
        }]
        mission_risk_after = evaluate_mission_window_risk(
            asset_data={"asset_code": asset.asset_code, "status": asset.status},
            components=restored_comps_data,
            mission_window_hours=12.0,
            mission_start_hours=36.0
        )

        # FINAL CRITICAL ASSERTION: AFTER INTERVENTION
        # BEFORE: mission at risk (NMC)
        # AFTER: mission readiness recovered (FMC)
        assert mission_risk_after["mission_at_risk"] is False
        assert mission_risk_after["can_execute_mission"] is True
        assert mission_risk_after["risk_verdict"] == "NO_CONFLICT"
        assert mission_risk_after["readiness_status"] == "FMC"
        assert mission_risk_after["readiness_score"] >= 85.0
