"""Fleet readiness and asset inspection routes."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.api.deps import get_current_user
from src.backend.app.core.readiness import calculate_asset_readiness, calculate_fleet_readiness_summary
from src.backend.app.db.base import get_db
from src.backend.app.db.models import Asset, Component, MissionWindow, User
from src.backend.app.schemas.fleet import AssetDetailOut, AssetOut, FleetSummaryOut

router = APIRouter(prefix="/fleet", tags=["Fleet Readiness"])


@router.get("/summary", response_model=FleetSummaryOut)
async def get_fleet_summary(session: AsyncSession = Depends(get_db)):
    """Computes real-time fleet readiness summary and NMC alerts."""
    result = await session.execute(select(Asset).options(selectinload(Asset.components)))
    assets = result.scalars().all()

    fmc = [a for a in assets if a.status == "FMC"]
    pmc = [a for a in assets if a.status == "PMC"]
    nmc = [a for a in assets if a.status == "NMC"]
    total = len(assets)
    avg_score = round(sum(a.readiness_score for a in assets) / total, 1) if total else 0.0
    fmc_pct = round((len(fmc) / total) * 100.0, 1) if total else 0.0

    critical_attention = []
    for a in nmc:
        critical_attention.append({
            "asset_id": a.id,
            "asset_code": a.asset_code,
            "name": a.name,
            "status": "NMC",
            "readiness_score": a.readiness_score,
            "issues": [
                {
                    "component_id": c.id,
                    "component_name": c.name,
                    "component_type": c.component_type,
                    "issue": f"Predicted RUL ({c.current_rul:.1f} hrs) fails before mission window (48.0 hrs). Imminent failure risk.",
                    "severity": "CRITICAL",
                    "is_flight_critical": True
                } for c in a.components if c.risk_level in ("HIGH", "CRITICAL")
            ]
        })

    for a in pmc:
        critical_attention.append({
            "asset_id": a.id,
            "asset_code": a.asset_code,
            "name": a.name,
            "status": "PMC",
            "readiness_score": a.readiness_score,
            "issues": [
                {
                    "component_id": c.id,
                    "component_name": c.name,
                    "component_type": c.component_type,
                    "issue": f"Secondary subsystem degradation detected with RUL ({c.current_rul:.1f} hrs).",
                    "severity": "HIGH",
                    "is_flight_critical": False
                } for c in a.components if c.risk_level in ("HIGH", "CRITICAL")
            ]
        })

    return {
        "total_assets": total,
        "fmc_count": len(fmc),
        "pmc_count": len(pmc),
        "nmc_count": len(nmc),
        "fmc_percentage": fmc_pct,
        "fleet_readiness_average": avg_score,
        "mission_ready_rate": fmc_pct,
        "critical_attention_count": len(critical_attention),
        "critical_attention_required": critical_attention
    }


@router.get("/assets", response_model=List[AssetOut])
async def list_assets(
    status: Optional[str] = Query(None, description="Filter by status: FMC, PMC, NMC"),
    squadron: Optional[str] = Query(None, description="Filter by squadron"),
    session: AsyncSession = Depends(get_db)
):
    """Lists all military platforms with optional filtering."""
    query = select(Asset)
    if status:
        query = query.filter(Asset.status == status.upper())
    if squadron:
        query = query.filter(Asset.squadron.ilike(f"%{squadron}%"))

    result = await session.execute(query)
    return result.scalars().all()


@router.get("/assets/{asset_code}", response_model=AssetDetailOut)
async def get_asset(asset_code: str, session: AsyncSession = Depends(get_db)):
    """Retrieves full telemetry, components, and health status for an individual platform."""
    result = await session.execute(
        select(Asset).filter(Asset.asset_code == asset_code.strip().upper()).options(selectinload(Asset.components))
    )
    asset = result.scalars().first()
    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset '{asset_code}' not found")

    return asset


@router.get("/missions")
async def list_missions(session: AsyncSession = Depends(get_db)):
    """Lists all active and upcoming mission windows."""
    result = await session.execute(select(MissionWindow).order_by(MissionWindow.start_time))
    missions = result.scalars().all()
    return [
        {
            "id": m.id,
            "title": m.title,
            "description": m.description,
            "mission_type": m.mission_type,
            "start_time": m.start_time.isoformat(),
            "end_time": m.end_time.isoformat(),
            "required_assets_count": m.required_assets_count,
            "required_asset_type": m.required_asset_type,
            "priority": m.priority,
            "minimum_readiness_threshold": m.minimum_readiness_threshold
        } for m in missions
    ]
