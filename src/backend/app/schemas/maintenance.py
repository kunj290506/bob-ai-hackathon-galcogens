"""Maintenance work order and prediction schemas."""
from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel


class WorkOrderOut(BaseModel):
    id: int
    asset_id: int
    component_id: Optional[int] = None
    priority: str
    status: str
    title: str
    description: str
    estimated_hours: float
    required_parts: str
    assigned_to: Optional[str] = None
    created_by_ai: bool
    due_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class WorkOrderCreate(BaseModel):
    asset_id: int
    component_id: Optional[int] = None
    priority: str = "HIGH"
    title: str
    description: str
    estimated_hours: float = 4.0
    required_parts: str = "[]"
    assigned_to: Optional[str] = None
    due_date: Optional[datetime] = None


class WorkOrderStatusUpdate(BaseModel):
    status: str  # PENDING, APPROVED, IN_PROGRESS, COMPLETED, CANCELLED


class PredictionOut(BaseModel):
    id: int
    component_id: int
    predicted_at: datetime
    predicted_rul: float
    confidence_interval_lower: float
    confidence_interval_upper: float
    risk_level: str
    anomaly_score: float
    fails_before_mission: bool
    explanation: str
    model_version: str

    class Config:
        from_attributes = True


class CopilotChatRequest(BaseModel):
    message: str
    asset_code: Optional[str] = None


class CopilotChatResponse(BaseModel):
    response: str
    tools_used: List[str] = []
    timestamp: datetime
