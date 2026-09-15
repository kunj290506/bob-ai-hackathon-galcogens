"""Maintenance work order dispatch, turnaround planning, and lifecycle state machine."""
from datetime import datetime
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.api.deps import get_current_user, require_roles
from src.backend.app.core.planner import prioritize_work_orders, generate_recommended_maintenance_schedule
from src.backend.app.core.readiness import calculate_asset_readiness
from src.backend.app.db.base import get_db
from src.backend.app.db.models import Asset, Component, MaintenanceRecord, MissionWindow, Prediction, User, WorkOrder
from src.backend.app.schemas.maintenance import WorkOrderCreate, WorkOrderOut, WorkOrderStatusUpdate
from src.backend.app.services.audit_service import record_audit_event

router = APIRouter(prefix="/maintenance", tags=["Maintenance Planning"])

# Strict operational state transitions
VALID_STATUS_TRANSITIONS = {
    "PENDING": ["APPROVED", "CANCELLED"],
    "APPROVED": ["IN_PROGRESS", "CANCELLED"],
    "IN_PROGRESS": ["COMPLETED", "CANCELLED"],
    "COMPLETED": [],  # Terminal state
    "CANCELLED": []   # Terminal state
}

# Standard post-overhaul depot simulated service life (hours)
COMPONENT_BASELINE_SERVICE_LIFE = {
    "TURBOFAN_ENGINE": 180.0,
    "ROTOR_GEARBOX": 200.0,
    "HYDRAULIC_ACTUATOR": 160.0,
    "FUEL_PUMP": 140.0,
    "AVIONICS_RADAR": 250.0
}


@router.get("/work-orders", response_model=List[WorkOrderOut])
async def list_work_orders(
    status_filter: Optional[str] = Query(None, description="Filter by status: PENDING, APPROVED, IN_PROGRESS, COMPLETED, CANCELLED"),
    priority_filter: Optional[str] = Query(None, description="Filter by priority: CRITICAL, HIGH, MEDIUM, LOW"),
    session: AsyncSession = Depends(get_db)
):
    """Lists maintenance work orders across all fleet assets."""
    query = select(WorkOrder)
    if status_filter:
        query = query.filter(WorkOrder.status == status_filter.upper())
    if priority_filter:
        query = query.filter(WorkOrder.priority == priority_filter.upper())

    result = await session.execute(query.order_by(WorkOrder.created_at.desc()))
    return result.scalars().all()


@router.post("/work-orders", response_model=WorkOrderOut, status_code=status.HTTP_201_CREATED)
async def create_work_order(
    req: WorkOrderCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new maintenance work order.
    Checks for duplicate active work orders for the same component to prevent scheduling conflicts.
    """
    if req.component_id:
        # Check for duplicate active work order
        existing_res = await session.execute(
            select(WorkOrder).filter(
                WorkOrder.component_id == req.component_id,
                WorkOrder.status.in_(["PENDING", "APPROVED", "IN_PROGRESS"])
            )
        )
        existing_wo = existing_res.scalars().first()
        if existing_wo:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"An active work order (#{existing_wo.id} - '{existing_wo.title}') already exists for component ID {req.component_id}."
            )

    wo = WorkOrder(
        asset_id=req.asset_id,
        component_id=req.component_id,
        priority=req.priority.upper(),
        status="PENDING",
        title=req.title,
        description=req.description,
        estimated_hours=req.estimated_hours,
        required_parts=req.required_parts,
        assigned_to=req.assigned_to or current_user.full_name,
        created_by_ai=False,
        due_date=req.due_date
    )
    session.add(wo)
    await session.commit()
    await session.refresh(wo)

    await record_audit_event(
        session=session,
        action="WORK_ORDER_CREATE",
        entity_type="WORK_ORDER",
        username=current_user.username,
        user_id=current_user.id,
        entity_id=wo.id,
        details={"asset_id": wo.asset_id, "priority": wo.priority, "title": wo.title}
    )
    await session.commit()
    return wo


@router.patch("/work-orders/{order_id}", response_model=WorkOrderOut)
async def update_work_order_status(
    order_id: int,
    req: WorkOrderStatusUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Enforces the defense maintenance state machine:
    PENDING -> APPROVED -> IN_PROGRESS -> COMPLETED (or CANCELLED).
    Enforces RBAC authorization per transition, supersedes stale predictions upon completion,
    and recalculates asset readiness dynamically.
    """
    result = await session.execute(select(WorkOrder).filter(WorkOrder.id == order_id))
    wo = result.scalars().first()
    if not wo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Work order not found")

    new_status = req.status.upper()
    current_status = wo.status.upper()

    # 1. State machine transition check
    allowed_transitions = VALID_STATUS_TRANSITIONS.get(current_status, [])
    if new_status not in allowed_transitions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid state transition: Cannot transition from '{current_status}' to '{new_status}'. Allowed transitions: {allowed_transitions}"
        )

    # 2. RBAC Enforcement per transition
    user_role = getattr(current_user, "role", "").lower()
    if new_status == "APPROVED" and user_role not in ["commander", "maintenance_officer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Work order approval is restricted to Commander or Maintenance Officer. Current role: {user_role}"
        )
    if new_status == "CANCELLED" and user_role not in ["commander", "maintenance_officer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Work order cancellation is restricted to Commander or Maintenance Officer. Current role: {user_role}"
        )

    prev_status = wo.status
    wo.status = new_status

    if new_status == "APPROVED" and not wo.approved_by:
        wo.approved_by = current_user.full_name
        wo.approved_at = datetime.utcnow()

    # 3. Work Order Completion Realism & Prediction Invalidation Loop
    if new_status == "COMPLETED" and prev_status != "COMPLETED":
        # Step A: Restore Component health with simulated post-maintenance baseline life
        if wo.component_id:
            comp_res = await session.execute(select(Component).filter(Component.id == wo.component_id))
            comp = comp_res.scalars().first()
            if comp:
                baseline_life = COMPONENT_BASELINE_SERVICE_LIFE.get(comp.component_type, 180.0)
                comp.status = "HEALTHY"
                comp.risk_level = "LOW"
                comp.current_rul = baseline_life

                # Step B: Invalidate / supersede stale predictions in predictions table
                pred_res = await session.execute(
                    select(Prediction).filter(Prediction.component_id == comp.id)
                )
                for old_pred in pred_res.scalars().all():
                    old_pred.risk_level = "LOW"
                    old_pred.fails_before_mission = False
                    old_pred.predicted_rul = baseline_life
                    old_pred.explanation = (
                        f"Superseded by verified maintenance overhaul (#{wo.id} - '{wo.title}'). "
                        f"Subsystem restored to operational baseline ({baseline_life}h simulated service life)."
                    )

        # Step C: Recalculate the asset's readiness score dynamically
        asset_res = await session.execute(
            select(Asset).filter(Asset.id == wo.asset_id).options(selectinload(Asset.components))
        )
        asset = asset_res.scalars().first()
        if asset:
            comps_data = [
                {
                    "id": c.id,
                    "name": c.name,
                    "component_type": c.component_type,
                    "current_rul": c.current_rul,
                    "risk_level": c.risk_level,
                    "status": c.status
                }
                for c in asset.components
            ]
            readiness = calculate_asset_readiness(comps_data, in_maintenance=False)
            asset.readiness_score = readiness["readiness_score"]
            asset.status = readiness["status"]
            asset.last_maintenance_date = datetime.utcnow()

            # Step D: Create historical MaintenanceRecord
            maint_record = MaintenanceRecord(
                asset_id=asset.id,
                component_id=wo.component_id,
                maintenance_type="CORRECTIVE",
                title=f"Completed: {wo.title}",
                description=f"Turnaround overhaul verified by {current_user.full_name}. Component restored to healthy operational baseline.",
                performed_by=wo.assigned_to or current_user.full_name,
                completed_at=datetime.utcnow(),
                downtime_hours=wo.estimated_hours,
                parts_replaced=wo.required_parts,
                notes=f"Authorized work order #{wo.id}. Platform condition restored to {asset.status} ({asset.readiness_score}%)."
            )
            session.add(maint_record)

    await session.commit()
    await session.refresh(wo)

    # Log audit event
    await record_audit_event(
        session=session,
        action=f"WORK_ORDER_{new_status}",
        entity_type="WORK_ORDER",
        username=current_user.username,
        user_id=current_user.id,
        entity_id=wo.id,
        details={"previous_status": prev_status, "new_status": new_status, "asset_id": wo.asset_id}
    )
    await session.commit()

    return wo


@router.get("/plan")
async def get_optimized_plan(
    mission_window_hours: float = Query(48.0, description="Upcoming mission window horizon in hours"),
    session: AsyncSession = Depends(get_db)
):
    """Generates an AI-optimized turnaround plan ranking work orders by mission urgency."""
    wo_results = await session.execute(
        select(WorkOrder, Asset).join(Asset, WorkOrder.asset_id == Asset.id).filter(WorkOrder.status.in_(["PENDING", "APPROVED"]))
    )
    missions_res = await session.execute(select(MissionWindow))
    missions = missions_res.scalars().all()

    work_orders_list = []
    for wo, asset in wo_results.all():
        work_orders_list.append({
            "id": wo.id,
            "asset_code": asset.asset_code,
            "asset_name": asset.name,
            "title": wo.title,
            "description": wo.description,
            "priority": wo.priority,
            "estimated_hours": wo.estimated_hours,
            "status": wo.status,
            "assigned_to": wo.assigned_to,
            "required_parts": wo.required_parts
        })

    missions_data = [
        {
            "id": m.id,
            "title": m.title,
            "priority": m.priority,
            "start_time": m.start_time
        } for m in missions
    ]

    prioritized = prioritize_work_orders(work_orders_list, missions_data)
    return {
        "mission_window_hours": mission_window_hours,
        "total_actions": len(prioritized),
        "prioritized_actions": prioritized
    }


@router.get("/history/{asset_code}")
async def get_maintenance_history(asset_code: str, session: AsyncSession = Depends(get_db)):
    """Fetches historical maintenance records for a platform."""
    result = await session.execute(
        select(MaintenanceRecord, Asset)
        .join(Asset, MaintenanceRecord.asset_id == Asset.id)
        .filter(Asset.asset_code == asset_code.strip().upper())
        .order_by(MaintenanceRecord.completed_at.desc())
    )
    records = []
    for rec, asset in result.all():
        records.append({
            "id": rec.id,
            "title": rec.title,
            "maintenance_type": rec.maintenance_type,
            "description": rec.description,
            "performed_by": rec.performed_by,
            "completed_at": rec.completed_at.isoformat(),
            "downtime_hours": rec.downtime_hours,
            "parts_replaced": rec.parts_replaced,
            "notes": rec.notes
        })
    return records
