"""Fleet and component schemas."""
from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel


class ComponentOut(BaseModel):
    id: int
    name: str
    component_type: str
    part_number: str
    serial_number: str
    total_operating_hours: float
    expected_lifespan_hours: float
    current_rul: float
    risk_level: str
    status: str

    class Config:
        from_attributes = True


class AssetOut(BaseModel):
    id: int
    asset_code: str
    name: str
    asset_type: str
    model: str
    squadron: str
    base_location: str
    status: str
    readiness_score: float
    total_flight_hours: float
    total_cycles: int
    last_maintenance_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class AssetDetailOut(AssetOut):
    components: List[ComponentOut] = []


class FleetSummaryOut(BaseModel):
    total_assets: int
    fmc_count: int
    pmc_count: int
    nmc_count: int
    fmc_percentage: float
    fleet_readiness_average: float
    mission_ready_rate: float
    critical_attention_count: int
    critical_attention_required: List[Any] = []
