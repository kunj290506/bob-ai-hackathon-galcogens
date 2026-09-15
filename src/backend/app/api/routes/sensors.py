"""
Sensor Telemetry Ingestion & Anomaly Surveillance Routes.
Provides high-throughput HUMS sensor telemetry validation, ingestion,
and multi-sensor anomaly detection with strict server-side physical checks.
"""

from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.api.deps import get_current_user, require_roles
from src.backend.app.db.base import get_db
from src.backend.app.db.models import Asset, Component, SensorReading, User
from src.backend.app.services.audit_service import record_audit_event

router = APIRouter(prefix="/sensors", tags=["Sensor Telemetry"])

# Physical sensor parameter valid boundary definitions
SENSOR_PHYSICAL_RANGES = {
    "T30_TEMP": (400.0, 2500.0),        # High-Pressure Compressor Outlet Temp (°R)
    "T50_TEMP": (400.0, 2200.0),        # Low-Pressure Turbine Temp (°R)
    "P30_PRESSURE": (10.0, 800.0),      # Total Pressure at HPC Outlet (psia)
    "VIBRATION_RMS": (0.0, 60.0),       # Vibration RMS (mm/s)
    "BYPASS_RATIO": (1.0, 15.0),        # Engine Bypass Ratio
    "CORE_SPEED_RPM": (5000.0, 15000.0),# Core Rotor Speed (RPM)
    "FAN_SPEED_RPM": (1000.0, 6000.0),  # Fan Speed (RPM)
    "OIL_PRESSURE": (10.0, 120.0),      # Lubrication Oil Pressure (psi)
}


class SensorReadingInput(BaseModel):
    sensor_type: str = Field(..., description="Sensor parameter code, e.g. T30_TEMP, VIBRATION_RMS")
    value: float = Field(..., description="Observed numeric sensor measurement")
    unit: str = Field("", description="Measurement unit, e.g. deg R, psia, mm/s")
    timestamp: Optional[datetime] = Field(default_factory=datetime.utcnow)

    @field_validator("sensor_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        clean = v.strip().upper()
        if not clean:
            raise ValueError("sensor_type must not be blank")
        return clean

    @field_validator("value")
    @classmethod
    def validate_finite_and_physics(cls, v: float) -> float:
        if v is None or v != v:  # NaN check
            raise ValueError("Sensor measurement value must be a valid finite number")
        # Physical impossibility check: absolute zero / negative physical quantities
        if v < -0.001:
            raise ValueError(f"Physically impossible negative measurement ({v}). Absolute pressure, temperature (Rankine/Kelvin), and vibration RMS cannot be negative.")
        if v > 100000.0:
            raise ValueError(f"Physically impossible extreme value ({v}) exceeding sensor saturation limits.")
        return v

    @field_validator("timestamp")
    @classmethod
    def validate_timestamp_window(cls, v: Optional[datetime]) -> Optional[datetime]:
        if v is not None:
            now = datetime.utcnow()
            # Allow at most 5 minutes clock drift into future
            if v > now + timedelta(minutes=5):
                raise ValueError("Telemetry observation timestamp cannot be in the future.")
            # Reject historical telemetry older than 1 year
            if v < now - timedelta(days=365):
                raise ValueError("Telemetry observation timestamp exceeds maximum historical retention (365 days).")
        return v


class BatchTelemetryIngestRequest(BaseModel):
    component_id: int = Field(..., description="Target subsystem component database ID")
    readings: List[SensorReadingInput] = Field(..., min_length=1, max_length=500, description="Batch list of sensor observations (max 500)")


class SensorReadingOut(BaseModel):
    id: int
    component_id: int
    timestamp: datetime
    sensor_type: str
    value: float
    unit: str
    is_anomalous: bool
    anomaly_score: float

    model_config = {"from_attributes": True}


@router.post("/ingest", response_model=List[SensorReadingOut], status_code=status.HTTP_201_CREATED)
async def ingest_telemetry_batch(
    req: BatchTelemetryIngestRequest,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Ingests and validates batch HUMS telemetry for an asset component:
    - Validates against physical aeronautical bounds
    - Rejects future or excessively stale timestamps
    - Rejects duplicate observations for identical timestamp and sensor type
    - Evaluates real-time anomaly scores using statistical thresholds
    - Logs audit trail for telemetry record additions.
    """
    # Verify component exists
    comp_res = await session.execute(select(Component).filter(Component.id == req.component_id))
    component = comp_res.scalars().first()
    if not component:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Component ID {req.component_id} not found in inventory."
        )

    # Fetch recent readings to prevent duplicates
    timestamps = [r.timestamp or datetime.utcnow() for r in req.readings]
    min_ts = min(timestamps)
    max_ts = max(timestamps)

    existing_res = await session.execute(
        select(SensorReading).filter(
            SensorReading.component_id == req.component_id,
            SensorReading.timestamp >= min_ts,
            SensorReading.timestamp <= max_ts
        )
    )
    existing_keys = {
        (r.sensor_type, r.timestamp.replace(microsecond=0)) for r in existing_res.scalars().all()
    }

    created_records = []
    seen_in_batch = set()

    for r in req.readings:
        ts = (r.timestamp or datetime.utcnow()).replace(microsecond=0)
        key = (r.sensor_type, ts)
        if key in existing_keys or key in seen_in_batch:
            continue  # Avoid duplicate insertion within batch or against database

        seen_in_batch.add(key)

        # Physical boundary validation
        bounds = SENSOR_PHYSICAL_RANGES.get(r.sensor_type)
        is_anomalous = False
        anomaly_score = 0.0

        if bounds:
            low, high = bounds
            if r.value < low or r.value > high:
                is_anomalous = True
                deviation = max(low - r.value, r.value - high)
                anomaly_score = min(1.0, round(deviation / (high - low), 3))
        elif "VIBRATION" in r.sensor_type and r.value > 12.0:
            is_anomalous = True
            anomaly_score = min(1.0, round(r.value / 25.0, 3))

        reading_obj = SensorReading(
            component_id=req.component_id,
            timestamp=ts,
            sensor_type=r.sensor_type,
            value=r.value,
            unit=r.unit,
            is_anomalous=is_anomalous,
            anomaly_score=anomaly_score
        )
        session.add(reading_obj)
        created_records.append(reading_obj)
        existing_keys.add(key)

    await session.commit()
    for rec in created_records:
        await session.refresh(rec)

    # Record audit event
    await record_audit_event(
        session=session,
        action="TELEMETRY_INGEST",
        entity_type="COMPONENT",
        username=current_user.username,
        user_id=current_user.id,
        entity_id=req.component_id,
        details={
            "readings_count": len(created_records),
            "anomalies_flagged": sum(1 for r in created_records if r.is_anomalous)
        }
    )
    await session.commit()

    return created_records


@router.get("/{component_id}/readings", response_model=List[SensorReadingOut])
async def get_component_readings(
    component_id: int,
    limit: int = Query(50, le=500),
    session: AsyncSession = Depends(get_db)
):
    """Retrieves chronological sensor telemetry observations for a component."""
    result = await session.execute(
        select(SensorReading)
        .filter(SensorReading.component_id == component_id)
        .order_by(SensorReading.timestamp.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/{component_id}/anomalies", response_model=List[SensorReadingOut])
async def get_component_anomalies(
    component_id: int,
    session: AsyncSession = Depends(get_db)
):
    """Retrieves anomalous sensor observations flagged for a component."""
    result = await session.execute(
        select(SensorReading)
        .filter(SensorReading.component_id == component_id, SensorReading.is_anomalous == True)
        .order_by(SensorReading.timestamp.desc())
    )
    return result.scalars().all()
