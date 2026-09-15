"""
SQLAlchemy 2.0 Async Domain Models for Military Asset Fleet Management.
"""

from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey, Integer,
    String, Text, Enum as SQLEnum, Index
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from src.backend.app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    # Roles: commander, maintenance_officer, logistics_planner, technician, admin
    role: Mapped[str] = mapped_column(String(30), default="technician", nullable=False)
    unit: Mapped[str] = mapped_column(String(100), default="1st Fighter Wing", nullable=False)
    clearance_level: Mapped[str] = mapped_column(String(30), default="SECRET", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Asset(Base):
    """
    Military platforms (F-16 Viper, AH-64 Apache, UH-60 Black Hawk, etc.)
    """
    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    asset_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    asset_type: Mapped[str] = mapped_column(String(50), nullable=False) # FIGHTER_JET, HELICOPTER, etc.
    model: Mapped[str] = mapped_column(String(50), nullable=False)
    squadron: Mapped[str] = mapped_column(String(100), nullable=False)
    base_location: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Operational Status: FMC (Fully Mission Capable), PMC (Partially Mission Capable), NMC (Non-Mission Capable)
    status: Mapped[str] = mapped_column(String(20), default="FMC", index=True, nullable=False)
    readiness_score: Mapped[float] = mapped_column(Float, default=100.0, nullable=False) # 0.0 - 100.0
    
    total_flight_hours: Mapped[float] = mapped_column(Float, default=0.0)
    total_cycles: Mapped[int] = mapped_column(Integer, default=0)
    last_maintenance_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    components: Mapped[List["Component"]] = relationship("Component", back_populates="asset", cascade="all, delete-orphan")
    work_orders: Mapped[List["WorkOrder"]] = relationship("WorkOrder", back_populates="asset")
    maintenance_records: Mapped[List["MaintenanceRecord"]] = relationship("MaintenanceRecord", back_populates="asset")


class Component(Base):
    """
    Critical sub-systems (Turbofan Engine, Rotor Gearbox, Hydraulics, Radar)
    """
    __tablename__ = "components"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    asset_id: Mapped[int] = mapped_column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    component_type: Mapped[str] = mapped_column(String(50), nullable=False) # TURBOFAN_ENGINE, ROTOR_GEARBOX, etc.
    part_number: Mapped[str] = mapped_column(String(50), nullable=False)
    serial_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    
    installed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    total_operating_hours: Mapped[float] = mapped_column(Float, default=0.0)
    expected_lifespan_hours: Mapped[float] = mapped_column(Float, default=2000.0)
    
    # Current ML Predictions
    current_rul: Mapped[float] = mapped_column(Float, default=125.0)
    risk_level: Mapped[str] = mapped_column(String(20), default="LOW", index=True) # LOW, MEDIUM, HIGH, CRITICAL
    status: Mapped[str] = mapped_column(String(20), default="HEALTHY") # HEALTHY, DEGRADED, CRITICAL, FAILED

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    asset: Mapped["Asset"] = relationship("Asset", back_populates="components")
    sensor_readings: Mapped[List["SensorReading"]] = relationship("SensorReading", back_populates="component", cascade="all, delete-orphan")
    predictions: Mapped[List["Prediction"]] = relationship("Prediction", back_populates="component", cascade="all, delete-orphan")
    work_orders: Mapped[List["WorkOrder"]] = relationship("WorkOrder", back_populates="component")


class SensorReading(Base):
    """
    HUMS sensor telemetry (T30 temperature, P30 pressure, vibration, bypass ratio)
    """
    __tablename__ = "sensor_readings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    component_id: Mapped[int] = mapped_column(Integer, ForeignKey("components.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    sensor_type: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. T30_TEMP, P30_PRESSURE, VIBRATION_RMS
    value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(20), default="")
    is_anomalous: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    anomaly_score: Mapped[float] = mapped_column(Float, default=0.0)

    component: Mapped["Component"] = relationship("Component", back_populates="sensor_readings")


class Prediction(Base):
    """
    ML-generated Remaining Useful Life (RUL) forecasts and risk assessments.
    """
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    component_id: Mapped[int] = mapped_column(Integer, ForeignKey("components.id", ondelete="CASCADE"), nullable=False, index=True)
    predicted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    predicted_rul: Mapped[float] = mapped_column(Float, nullable=False)
    confidence_interval_lower: Mapped[float] = mapped_column(Float, nullable=False)
    confidence_interval_upper: Mapped[float] = mapped_column(Float, nullable=False)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    anomaly_score: Mapped[float] = mapped_column(Float, default=0.0)
    fails_before_mission: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    model_version: Mapped[str] = mapped_column(String(50), default="xgb-v1.0-cuda")

    component: Mapped["Component"] = relationship("Component", back_populates="predictions")


class WorkOrder(Base):
    """
    Optimized maintenance actions prioritized for upcoming mission windows.
    """
    __tablename__ = "work_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    asset_id: Mapped[int] = mapped_column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    component_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("components.id", ondelete="SET NULL"), nullable=True)
    prediction_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("predictions.id", ondelete="SET NULL"), nullable=True)
    
    priority: Mapped[str] = mapped_column(String(20), default="MEDIUM", index=True) # CRITICAL, HIGH, MEDIUM, LOW
    status: Mapped[str] = mapped_column(String(20), default="PENDING", index=True) # PENDING, APPROVED, IN_PROGRESS, COMPLETED, CANCELLED
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    
    estimated_hours: Mapped[float] = mapped_column(Float, default=4.0)
    required_parts: Mapped[str] = mapped_column(Text, default="[]") # JSON list of part numbers
    assigned_to: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    created_by_ai: Mapped[bool] = mapped_column(Boolean, default=True)
    approved_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    asset: Mapped["Asset"] = relationship("Asset", back_populates="work_orders")
    component: Mapped[Optional["Component"]] = relationship("Component", back_populates="work_orders")


class MaintenanceRecord(Base):
    """
    Historical service records.
    """
    __tablename__ = "maintenance_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    asset_id: Mapped[int] = mapped_column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    component_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("components.id", ondelete="SET NULL"), nullable=True)
    
    maintenance_type: Mapped[str] = mapped_column(String(50), nullable=False) # SCHEDULED, UNSCHEDULED, PREDICTIVE, CORRECTIVE
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    performed_by: Mapped[str] = mapped_column(String(100), nullable=False)
    completed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    downtime_hours: Mapped[float] = mapped_column(Float, default=0.0)
    parts_replaced: Mapped[str] = mapped_column(Text, default="[]")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    asset: Mapped["Asset"] = relationship("Asset", back_populates="maintenance_records")


class MissionWindow(Base):
    """
    Upcoming operational mission deployment windows.
    """
    __tablename__ = "mission_windows"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    mission_type: Mapped[str] = mapped_column(String(50), nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    
    required_assets_count: Mapped[int] = mapped_column(Integer, default=4)
    required_asset_type: Mapped[str] = mapped_column(String(50), default="FIGHTER_JET")
    priority: Mapped[str] = mapped_column(String(20), default="HIGH")
    minimum_readiness_threshold: Mapped[float] = mapped_column(Float, default=85.0) # Required readiness %
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    """
    Tamper-evident audit trail for defense operations.
    """
    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    username: Mapped[str] = mapped_column(String(50), default="SYSTEM")
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    details_json: Mapped[str] = mapped_column(Text, default="{}")
    ip_address: Mapped[str] = mapped_column(String(45), default="127.0.0.1")
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
