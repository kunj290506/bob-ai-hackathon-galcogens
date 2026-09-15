"""Predictive maintenance and anomaly detection routes."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.db.base import get_db
from src.backend.app.db.models import Asset, Component, Prediction, SensorReading
from src.backend.app.schemas.maintenance import PredictionOut

router = APIRouter(prefix="/predictions", tags=["Predictions & Anomalies"])


@router.get("/", response_model=List[PredictionOut])
async def list_predictions(
    risk_level: Optional[str] = Query(None, description="Filter by risk: CRITICAL, HIGH, MEDIUM, LOW"),
    session: AsyncSession = Depends(get_db)
):
    """Lists component failure predictions across the fleet."""
    query = select(Prediction)
    if risk_level:
        query = query.filter(Prediction.risk_level == risk_level.upper())

    result = await session.execute(query.order_by(Prediction.predicted_rul.asc()))
    return result.scalars().all()


@router.get("/asset/{asset_code}")
async def get_asset_predictions(asset_code: str, session: AsyncSession = Depends(get_db)):
    """Retrieves all component predictions for a specific aircraft/vehicle."""
    query = (
        select(Prediction, Component)
        .join(Component, Prediction.component_id == Component.id)
        .join(Asset, Component.asset_id == Asset.id)
        .filter(Asset.asset_code == asset_code.strip().upper())
    )
    result = await session.execute(query)
    items = []
    for pred, comp in result.all():
        items.append({
            "component_id": comp.id,
            "component_name": comp.name,
            "component_type": comp.component_type,
            "predicted_rul": pred.predicted_rul,
            "confidence_bounds": [pred.confidence_interval_lower, pred.confidence_interval_upper],
            "risk_level": pred.risk_level,
            "anomaly_score": pred.anomaly_score,
            "fails_before_mission": pred.fails_before_mission,
            "explanation": pred.explanation
        })
    return items


@router.get("/anomalies")
async def list_sensor_anomalies(
    asset_code: Optional[str] = None,
    session: AsyncSession = Depends(get_db)
):
    """Retrieves all active sensor anomalies and thermal/pressure drift readings."""
    query = (
        select(SensorReading, Component, Asset)
        .join(Component, SensorReading.component_id == Component.id)
        .join(Asset, Component.asset_id == Asset.id)
        .filter(SensorReading.is_anomalous == True)
    )
    if asset_code:
        query = query.filter(Asset.asset_code == asset_code.strip().upper())

    result = await session.execute(query.order_by(SensorReading.timestamp.desc()).limit(50))
    anomalies = []
    for reading, comp, asset in result.all():
        anomalies.append({
            "asset_code": asset.asset_code,
            "asset_name": asset.name,
            "component_name": comp.name,
            "sensor_type": reading.sensor_type,
            "value": reading.value,
            "unit": reading.unit,
            "anomaly_score": reading.anomaly_score,
            "timestamp": reading.timestamp.isoformat()
        })
    return anomalies
