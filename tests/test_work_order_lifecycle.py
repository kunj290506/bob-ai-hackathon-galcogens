"""
Integration Tests for Maintenance Work Order Lifecycle.
Verifies state transitions:
PENDING -> APPROVED -> IN_PROGRESS -> COMPLETED
and ensures readiness is dynamically recalculated only upon actual completion.
"""

import pytest
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.backend.app.db.base import async_session_factory
from src.backend.app.db.models import Asset, Component, WorkOrder, MaintenanceRecord, User
from src.backend.app.api.routes.maintenance import update_work_order_status
from src.backend.app.schemas.maintenance import WorkOrderStatusUpdate


@pytest.mark.asyncio
async def test_work_order_full_lifecycle_and_readiness_restoration():
    """
    Simulates complete work order lifecycle:
    1. Asset is initially degraded (NMC) due to a critical turbofan component.
    2. Work order is created in PENDING state (asset remains NMC).
    3. Commander approves the work order -> APPROVED (asset remains NMC).
    4. Technician transitions to IN_PROGRESS (asset remains NMC).
    5. Technician marks COMPLETED -> Component is restored, Asset recalculated to FMC!
    """
    async with async_session_factory() as session:
        import uuid
        uid = uuid.uuid4().hex[:6]
        # Create test commander
        commander = User(
            username=f"test.lifecycle.commander.{uid}",
            email=f"cmd.{uid}@defense.mil",
            hashed_password="hashed_placeholder",
            full_name="Col. Test Commander",
            role="commander",
            unit="388th FW",
            clearance_level="TOP_SECRET"
        )
        session.add(commander)

        # Create degraded test asset
        asset = Asset(
            asset_code=f"F16-TEST-LC-{uid}",
            name="Test Viper 999",
            asset_type="FIGHTER_JET",
            model="F-16C Fighting Falcon",
            squadron="388th Fighter Wing",
            base_location="Hill AFB, UT",
            status="NMC",
            readiness_score=45.0
        )
        session.add(asset)
        await session.flush()

        # Add failed critical component
        component = Component(
            asset_id=asset.id,
            name="F100-PW-229 Engine",
            component_type="TURBOFAN_ENGINE",
            part_number="PN-ENG-999",
            serial_number=f"SN-ENG-LC-{uid}",
            current_rul=12.0,
            risk_level="CRITICAL",
            status="FAILED"
        )
        session.add(component)
        await session.flush()

        # 1. Create work order
        wo = WorkOrder(
            asset_id=asset.id,
            component_id=component.id,
            priority="CRITICAL",
            status="PENDING",
            title="Overhaul degraded turbine blades",
            description="High vibration and EGT spike observed.",
            estimated_hours=6.0,
            assigned_to="Tech Sgt. Adams"
        )
        session.add(wo)
        await session.commit()
        await session.refresh(wo)

        assert wo.status == "PENDING"
        # Asset must remain NMC
        await session.refresh(asset)
        assert asset.status == "NMC"

        # 2. Approve work order
        update_req = WorkOrderStatusUpdate(status="APPROVED")
        updated_wo = await update_work_order_status(
            order_id=wo.id,
            req=update_req,
            session=session,
            current_user=commander
        )
        assert updated_wo.status == "APPROVED"
        assert updated_wo.approved_by == commander.full_name
        # Asset still remains NMC
        await session.refresh(asset)
        assert asset.status == "NMC"

        # 3. Transition to IN_PROGRESS
        update_req = WorkOrderStatusUpdate(status="IN_PROGRESS")
        updated_wo = await update_work_order_status(
            order_id=wo.id,
            req=update_req,
            session=session,
            current_user=commander
        )
        assert updated_wo.status == "IN_PROGRESS"

        # 4. Transition to COMPLETED
        update_req = WorkOrderStatusUpdate(status="COMPLETED")
        updated_wo = await update_work_order_status(
            order_id=wo.id,
            req=update_req,
            session=session,
            current_user=commander
        )
        assert updated_wo.status == "COMPLETED"

        # Verify component restored
        await session.refresh(component)
        assert component.status == "HEALTHY"
        assert component.risk_level == "LOW"
        assert component.current_rul >= 100.0

        # Verify asset readiness recalculated dynamically to FMC!
        await session.refresh(asset)
        assert asset.status == "FMC"
        assert asset.readiness_score >= 85.0

        # Verify MaintenanceRecord was created
        maint_res = await session.execute(
            select(MaintenanceRecord).filter(MaintenanceRecord.asset_id == asset.id)
        )
        records = maint_res.scalars().all()
        assert len(records) >= 1
        assert "Overhaul degraded turbine blades" in records[0].title


@pytest.mark.asyncio
async def test_invalid_work_order_status_transitions():
    """Verifies that invalid state transitions are strictly rejected with HTTP 400."""
    from fastapi import HTTPException
    import uuid
    uid = uuid.uuid4().hex[:6]

    async with async_session_factory() as session:
        user = User(
            username=f"test.invalid.trans.{uid}",
            email=f"invalid.{uid}@defense.mil",
            hashed_password="hashed_placeholder",
            full_name="Maj. State Machine",
            role="commander",
            unit="388th FW",
            clearance_level="SECRET"
        )
        session.add(user)

        asset = Asset(
            asset_code=f"F16-TEST-INV-{uid}",
            name="Test Falcon Inv",
            asset_type="FIGHTER_JET",
            model="F-16C",
            squadron="388th FW",
            base_location="Hill AFB",
            status="PMC",
            readiness_score=75.0
        )
        session.add(asset)
        await session.flush()

        wo = WorkOrder(
            asset_id=asset.id,
            priority="HIGH",
            status="PENDING",
            title="Hydraulic check",
            description="Inspection required.",
            estimated_hours=2.0,
            assigned_to="Tech"
        )
        session.add(wo)
        await session.commit()
        await session.refresh(wo)

        # 1. Direct PENDING -> COMPLETED is invalid (must go through APPROVED -> IN_PROGRESS)
        with pytest.raises(HTTPException) as exc_info:
            await update_work_order_status(
                order_id=wo.id,
                req=WorkOrderStatusUpdate(status="COMPLETED"),
                session=session,
                current_user=user
            )
        assert exc_info.value.status_code == 400
        assert "Invalid state transition" in exc_info.value.detail

        # 2. Advance to APPROVED, then IN_PROGRESS, then COMPLETED
        await update_work_order_status(
            order_id=wo.id,
            req=WorkOrderStatusUpdate(status="APPROVED"),
            session=session,
            current_user=user
        )
        await update_work_order_status(
            order_id=wo.id,
            req=WorkOrderStatusUpdate(status="IN_PROGRESS"),
            session=session,
            current_user=user
        )
        await update_work_order_status(
            order_id=wo.id,
            req=WorkOrderStatusUpdate(status="COMPLETED"),
            session=session,
            current_user=user
        )

        # 3. COMPLETED is terminal; transitioning back to APPROVED must fail
        with pytest.raises(HTTPException) as exc_info:
            await update_work_order_status(
                order_id=wo.id,
                req=WorkOrderStatusUpdate(status="APPROVED"),
                session=session,
                current_user=user
            )
        assert exc_info.value.status_code == 400
        assert "terminal state" in exc_info.value.detail or "Invalid state transition" in exc_info.value.detail


@pytest.mark.asyncio
async def test_duplicate_active_work_order_prevention():
    """Verifies that duplicate active work orders for the same component return HTTP 409 Conflict."""
    from fastapi import HTTPException
    from src.backend.app.api.routes.maintenance import create_work_order
    from src.backend.app.schemas.maintenance import WorkOrderCreate
    import uuid
    uid = uuid.uuid4().hex[:6]

    async with async_session_factory() as session:
        user = User(
            username=f"test.dup.wo.{uid}",
            email=f"dup.{uid}@defense.mil",
            hashed_password="hashed_placeholder",
            full_name="Sgt. Conflict Checker",
            role="maintenance_officer",
            unit="388th FW",
            clearance_level="SECRET"
        )
        session.add(user)

        asset = Asset(
            asset_code=f"F16-TEST-DUP-{uid}",
            name="Test Falcon Dup",
            asset_type="FIGHTER_JET",
            model="F-16C",
            squadron="388th FW",
            base_location="Hill AFB",
            status="PMC",
            readiness_score=70.0
        )
        session.add(asset)
        await session.flush()

        comp = Component(
            asset_id=asset.id,
            name="Radar Module",
            component_type="RADAR",
            part_number="PN-RADAR-1",
            serial_number=f"SN-RADAR-{uid}",
            current_rul=50.0,
            risk_level="MEDIUM",
            status="DEGRADED"
        )
        session.add(comp)
        await session.flush()

        # Create first work order
        req1 = WorkOrderCreate(
            asset_id=asset.id,
            component_id=comp.id,
            priority="HIGH",
            title="Radar overhaul",
            description="Replace T/R modules",
            estimated_hours=4.0
        )
        wo1 = await create_work_order(req=req1, session=session, current_user=user)
        assert wo1.id is not None

        # Attempt to create duplicate active work order for the same component
        req2 = WorkOrderCreate(
            asset_id=asset.id,
            component_id=comp.id,
            priority="CRITICAL",
            title="Duplicate radar repair request",
            description="Duplicate attempt",
            estimated_hours=3.0
        )
        with pytest.raises(HTTPException) as exc_info:
            await create_work_order(req=req2, session=session, current_user=user)
        assert exc_info.value.status_code == 409
        assert "already exists for component ID" in exc_info.value.detail


@pytest.mark.asyncio
async def test_stale_prediction_invalidation_on_completion():
    """Verifies that completing a work order supersedes and invalidates stale prediction records in DB."""
    from src.backend.app.db.models import Prediction
    import uuid
    uid = uuid.uuid4().hex[:6]

    async with async_session_factory() as session:
        user = User(
            username=f"test.stale.pred.{uid}",
            email=f"stale.{uid}@defense.mil",
            hashed_password="hashed_placeholder",
            full_name="Capt. Invalidation",
            role="commander",
            unit="388th FW",
            clearance_level="TOP_SECRET"
        )
        session.add(user)

        asset = Asset(
            asset_code=f"F16-TEST-STALE-{uid}",
            name="Test Falcon Stale",
            asset_type="FIGHTER_JET",
            model="F-16C",
            squadron="388th FW",
            base_location="Hill AFB",
            status="NMC",
            readiness_score=40.0
        )
        session.add(asset)
        await session.flush()

        comp = Component(
            asset_id=asset.id,
            name="Turbofan Engine",
            component_type="TURBOFAN_ENGINE",
            part_number="PN-ENG-STALE",
            serial_number=f"SN-ENG-STALE-{uid}",
            current_rul=15.0,
            risk_level="CRITICAL",
            status="FAILED"
        )
        session.add(comp)
        await session.flush()

        # Seed an active critical prediction that predicts failure before mission
        stale_pred = Prediction(
            component_id=comp.id,
            predicted_rul=15.0,
            confidence_interval_lower=5.0,
            confidence_interval_upper=25.0,
            risk_level="CRITICAL",
            anomaly_score=0.92,
            fails_before_mission=True,
            explanation="Critical turbine blade erosion detected. Failure predicted at T+15h.",
            model_version="xgboost-v1.0"
        )
        session.add(stale_pred)
        await session.flush()

        # Create, approve, start, complete work order
        wo = WorkOrder(
            asset_id=asset.id,
            component_id=comp.id,
            priority="CRITICAL",
            status="PENDING",
            title="Turbofan engine swap",
            description="Replace core turbine module",
            estimated_hours=8.0,
            assigned_to="Lead Specialist"
        )
        session.add(wo)
        await session.commit()
        await session.refresh(wo)

        await update_work_order_status(
            order_id=wo.id,
            req=WorkOrderStatusUpdate(status="APPROVED"),
            session=session,
            current_user=user
        )
        await update_work_order_status(
            order_id=wo.id,
            req=WorkOrderStatusUpdate(status="IN_PROGRESS"),
            session=session,
            current_user=user
        )
        await update_work_order_status(
            order_id=wo.id,
            req=WorkOrderStatusUpdate(status="COMPLETED"),
            session=session,
            current_user=user
        )

        # Refresh prediction from DB and verify invalidation
        await session.refresh(stale_pred)
        assert stale_pred.fails_before_mission is False
        assert stale_pred.risk_level == "LOW"
        assert "Superseded by verified maintenance overhaul" in stale_pred.explanation
