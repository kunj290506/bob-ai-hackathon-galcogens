"""Maintenance work order dispatch and turnaround planning routes."""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.api.deps import get_current_user, require_roles
from src.backend.app.core.planner import prioritize_work_orders, generate_recommended_maintenance_schedule
from src.backend.app.db.base import get_db
from src.backend.app.db.models import Asset, MaintenanceRecord, MissionWindow, User, WorkOrder
from src.backend.app.schemas.maintenance import WorkOrderCreate, WorkOrderOut, WorkOrderStatusUpdate

router = APIRouter(prefix="/maintenance", tags=["Maintenance Planning"])


@router.get("/work-orders", response_model=List[WorkOrderOut])
async def list_work_orders(
    status_filter: Optional[str] = Query(None, description="Filter by status: PENDING, APPROVED, IN_PROGRESS, COMPLETED"),
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
    """Creates a new maintenance work order."""
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
    return wo


@router.patch("/work-orders/{order_id}", response_model=WorkOrderOut)
async def update_work_order_status(
    order_id: int,
    req: WorkOrderStatusUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Approves, updates, or completes a work order."""
    result = await session.execute(select(WorkOrder).filter(WorkOrder.id == order_id))
    wo = result.scalars().first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")

    new_status = req.status.upper()
    valid_statuses = ["PENDING", "APPROVED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    wo.status = new_status
    if new_status == "APPROVED" and not wo.approved_by:
        wo.approved_by = current_user.full_name
        wo.approved_at = datetime.utcnow()

    await session.commit()
    await session.refresh(wo)
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
            "assigned_to": wo.assigned_to
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
