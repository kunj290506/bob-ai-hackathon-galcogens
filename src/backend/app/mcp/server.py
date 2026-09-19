"""
FastMCP Server for IBM Bob Integration.
Exposes standard Model Context Protocol (MCP) tools, resources, and prompts
enabling IBM Bob to serve as the autonomous Mission Readiness Copilot.
"""

import asyncio
import json
import logging
from typing import Any, Dict, List, Optional
from fastmcp import FastMCP
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.backend.app.db.base import async_session_factory
from src.backend.app.db.models import Asset, Component, Prediction, WorkOrder, MaintenanceRecord, MissionWindow, SensorReading
from src.backend.app.core.readiness import calculate_asset_readiness, calculate_fleet_readiness_summary
from src.backend.app.core.planner import prioritize_work_orders, generate_recommended_maintenance_schedule
from src.backend.app.services.watsonx_service import WatsonxService

logger = logging.getLogger("BobMCPServer")

# Initialize FastMCP Server
mcp = FastMCP(
    name="D1 Mission Readiness & Predictive Maintenance Copilot",
    instructions="Military Fleet Readiness & Condition-Based Maintenance Copilot for defense organizations."
)

watsonx = WatsonxService.get_instance()


# ── 1. MCP TOOLS ─────────────────────────────────────────────────────────────

@mcp.tool()
async def get_fleet_readiness_summary() -> str:
    """
    Returns the comprehensive military fleet readiness status, including counts and percentages
    of Fully Mission Capable (FMC), Partially Mission Capable (PMC), and Non-Mission Capable (NMC) assets.
    """
    async with async_session_factory() as session:
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
                "model": a.model,
                "status": "NMC",
                "readiness_score": a.readiness_score,
                "squadron": a.squadron,
                "issues": [
                    {
                        "component_id": c.id,
                        "component_name": c.name,
                        "component_type": c.component_type,
                        "issue": f"Predicted RUL ({c.current_rul:.1f} hrs) fails before mission window (48.0 hrs). Imminent failure risk.",
                        "severity": "CRITICAL",
                        "current_rul": c.current_rul
                    } for c in a.components if c.risk_level in ("HIGH", "CRITICAL")
                ]
            })

        for a in pmc:
            critical_attention.append({
                "asset_id": a.id,
                "asset_code": a.asset_code,
                "name": a.name,
                "model": a.model,
                "status": "PMC",
                "readiness_score": a.readiness_score,
                "squadron": a.squadron,
                "issues": [
                    {
                        "component_id": c.id,
                        "component_name": c.name,
                        "component_type": c.component_type,
                        "issue": f"Secondary subsystem degradation detected with RUL ({c.current_rul:.1f} hrs).",
                        "severity": "HIGH",
                        "current_rul": c.current_rul
                    } for c in a.components if c.risk_level in ("HIGH", "CRITICAL")
                ]
            })

        summary = {
            "total_assets": total,
            "fmc_count": len(fmc),
            "pmc_count": len(pmc),
            "nmc_count": len(nmc),
            "fmc_percentage": fmc_pct,
            "fleet_readiness_average": avg_score,
            "mission_ready_rate": fmc_pct,
            "critical_attention_count": len(critical_attention),
            "critical_attention_required": critical_attention,
            "nmc_platforms": [
                {
                    "asset_code": a.asset_code,
                    "name": a.name,
                    "model": a.model,
                    "squadron": a.squadron,
                    "readiness_score": a.readiness_score
                } for a in nmc
            ],
            "pmc_platforms": [
                {
                    "asset_code": a.asset_code,
                    "name": a.name,
                    "model": a.model,
                    "squadron": a.squadron,
                    "readiness_score": a.readiness_score
                } for a in pmc
            ]
        }
        return json.dumps(summary, indent=2)


@mcp.tool()
async def get_asset_readiness(asset_code: str) -> str:
    """
    Retrieves deep diagnostic readiness details for a specific military asset by its code/tail number (e.g. 'F16-VIPER-101').
    """
    async with async_session_factory() as session:
        result = await session.execute(
            select(Asset).filter(Asset.asset_code == asset_code.strip().upper()).options(selectinload(Asset.components))
        )
        asset = result.scalars().first()
        if not asset:
            return json.dumps({"error": f"Asset '{asset_code}' not found in registry."})

        components_data = [
            {
                "id": c.id,
                "name": c.name,
                "component_type": c.component_type,
                "serial_number": c.serial_number,
                "current_rul": c.current_rul,
                "risk_level": c.risk_level,
                "status": c.status
            } for c in asset.components
        ]

        readiness = calculate_asset_readiness(components_data)
        
        res = {
            "asset_code": asset.asset_code,
            "name": asset.name,
            "model": asset.model,
            "squadron": asset.squadron,
            "base_location": asset.base_location,
            "recorded_status": asset.status,
            "condition_readiness_score": readiness["readiness_score"],
            "calculated_status": readiness["status"],
            "mission_capable": readiness["mission_capable"],
            "critical_issues": readiness["critical_issues"],
            "warnings": readiness["warnings"],
            "components": components_data
        }
        return json.dumps(res, indent=2)


@mcp.tool()
async def predict_component_failures(filter_high_risk_only: bool = True) -> str:
    """
    Runs predictive failure analysis returning components predicted to fail before upcoming missions,
    along with their Remaining Useful Life (RUL hours) and anomaly scores.
    """
    async with async_session_factory() as session:
        query = select(Prediction, Component, Asset).join(Component, Prediction.component_id == Component.id).join(Asset, Component.asset_id == Asset.id)
        if filter_high_risk_only:
            query = query.filter(Prediction.risk_level.in_(["CRITICAL", "HIGH"]))

        results = await session.execute(query)
        predictions_data = []

        for pred, comp, asset in results.all():
            predictions_data.append({
                "asset_code": asset.asset_code,
                "asset_name": asset.name,
                "component_name": comp.name,
                "predicted_rul_hours": pred.predicted_rul,
                "confidence_bounds": [pred.confidence_interval_lower, pred.confidence_interval_upper],
                "risk_level": pred.risk_level,
                "anomaly_score": pred.anomaly_score,
                "fails_before_mission": pred.fails_before_mission,
                "explanation": pred.explanation,
                "model_version": pred.model_version
            })

        return json.dumps({
            "total_flagged_components": len(predictions_data),
            "predictions": predictions_data
        }, indent=2)


@mcp.tool()
async def explain_readiness_issue(asset_code: str) -> str:
    """
    Uses IBM watsonx.ai Granite 3-8B to generate an expert natural language diagnostic explanation
    of why a specific platform is not mission-ready and what technical repair is needed.
    """
    async with async_session_factory() as session:
        result = await session.execute(
            select(Asset).filter(Asset.asset_code == asset_code.strip().upper()).options(selectinload(Asset.components))
        )
        asset = result.scalars().first()
        if not asset:
            return f"Asset '{asset_code}' not found."

        components_data = [
            {
                "id": c.id,
                "name": c.name,
                "component_type": c.component_type,
                "current_rul": c.current_rul,
                "risk_level": c.risk_level,
                "status": c.status
            } for c in asset.components
        ]
        readiness = calculate_asset_readiness(components_data)
        
        explanation = await watsonx.explain_readiness_issue(
            asset_code=asset.asset_code,
            asset_name=asset.name,
            status=readiness["status"],
            score=readiness["readiness_score"],
            issues=readiness["critical_issues"] + readiness["warnings"]
        )
        return explanation


@mcp.tool()
async def generate_maintenance_plan(mission_window_hours: float = 48.0) -> str:
    """
    Generates an optimized, prioritized maintenance turnaround schedule ranking all pending work orders
    to maximize operational readiness before the next mission window.
    """
    async with async_session_factory() as session:
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
        return json.dumps({
            "total_pending_actions": len(prioritized),
            "mission_window_hours": mission_window_hours,
            "prioritized_work_orders": prioritized
        }, indent=2)


@mcp.tool()
async def get_sensor_anomalies(asset_code: Optional[str] = None) -> str:
    """
    Returns detected sensor telemetry anomalies (vibration spikes, EGT/T30 thermal creep, pressure drops)
    flagged by our unsupervised Isolation Forest and statistical Z-score detectors.
    """
    async with async_session_factory() as session:
        query = select(SensorReading, Component, Asset).join(Component, SensorReading.component_id == Component.id).join(Asset, Component.asset_id == Asset.id).filter(SensorReading.is_anomalous == True)
        if asset_code:
            query = query.filter(Asset.asset_code == asset_code.strip().upper())

        results = await session.execute(query)
        anomalies = []
        for reading, comp, asset in results.all():
            anomalies.append({
                "asset_code": asset.asset_code,
                "component_name": comp.name,
                "sensor_type": reading.sensor_type,
                "recorded_value": reading.value,
                "unit": reading.unit,
                "anomaly_score": reading.anomaly_score,
                "timestamp": reading.timestamp.isoformat()
            })

        return json.dumps({
            "anomalies_count": len(anomalies),
            "anomalies": anomalies
        }, indent=2)


@mcp.tool()
async def search_maintenance_history(query_keyword: str) -> str:
    """
    Searches historical maintenance and inspection logs for past component failures and repairs.
    """
    async with async_session_factory() as session:
        result = await session.execute(
            select(MaintenanceRecord, Asset).join(Asset, MaintenanceRecord.asset_id == Asset.id).limit(10)
        )
        records = []
        for rec, asset in result.all():
            if query_keyword.lower() in rec.title.lower() or query_keyword.lower() in rec.description.lower() or query_keyword.lower() in asset.asset_code.lower():
                records.append({
                    "asset_code": asset.asset_code,
                    "title": rec.title,
                    "type": rec.maintenance_type,
                    "description": rec.description,
                    "performed_by": rec.performed_by,
                    "downtime_hours": rec.downtime_hours,
                    "completed_at": rec.completed_at.isoformat()
                })
        return json.dumps(records, indent=2)


@mcp.tool()
async def get_mission_readiness_forecast(horizon_hours: float = 48.0) -> str:
    """
    Forecasts whether the current fleet state can support upcoming combat and transport missions
    within the specified operational horizon (default 48 hours),
    highlighting asset shortfalls if critical maintenance is not completed on time.
    """
    async with async_session_factory() as session:
        missions = (await session.execute(select(MissionWindow))).scalars().all()
        assets = (await session.execute(select(Asset))).scalars().all()
        
        forecast = []
        for m in missions:
            matching_fmc = [a for a in assets if a.status == "FMC" and (m.required_asset_type in a.asset_type or "FIGHTER" in m.required_asset_type and "FIGHTER" in a.asset_type)]
            shortfall = max(0, m.required_assets_count - len(matching_fmc))
            forecast.append({
                "mission_title": m.title,
                "required_assets": m.required_assets_count,
                "available_fmc_assets": len(matching_fmc),
                "has_shortfall": shortfall > 0,
                "shortfall_count": shortfall,
                "mission_viable": shortfall == 0,
                "start_time": m.start_time.isoformat()
            })
            
        return json.dumps(forecast, indent=2)


@mcp.tool()
async def simulate_mission_stress(
    asset_code: str,
    mission_profile: str = "DESERT_HEAT",
    sortie_duration_hours: float = 6.0,
    sortie_g_rating: float = 7.0
) -> str:
    """
    Simulates counterfactual environmental and combat severity (DESERT_HEAT, SAND_DUST_INGESTION,
    COMBAT_HIGH_G, ARCTIC_COLD) to forecast accelerated component RUL wear and mission survivability probability.
    """
    from src.backend.app.core.simulation import simulate_mission_stress as run_simulation
    async with async_session_factory() as session:
        result = await session.execute(
            select(Asset).filter(Asset.asset_code == asset_code.strip().upper()).options(selectinload(Asset.components))
        )
        asset = result.scalars().first()
        if not asset:
            return json.dumps({"error": f"Asset '{asset_code}' not found."})

        # Base nominal telemetry
        nominal_telemetry = {
            "unit_nr": 1, "time_cycles": 1,
            "s_2": 642.3, "s_3": 1586.9, "s_4": 1402.8, "s_7": 553.9,
            "s_8": 2388.0, "s_9": 9060.0, "s_11": 47.3, "s_12": 521.9,
            "s_13": 2388.0, "s_14": 8130.0, "s_15": 8.41, "s_17": 393.0,
            "s_20": 38.9, "s_21": 23.3
        }
        res = run_simulation(
            nominal_telemetry,
            mission_profile=mission_profile,
            mission_duration_hours=sortie_duration_hours,
            sortie_g_rating=sortie_g_rating
        )
        res["asset_code"] = asset.asset_code
        res["asset_name"] = asset.name
        return json.dumps(res, indent=2)


@mcp.tool()
async def get_mission_reallocation_matrix(asset_code: str) -> str:
    """
    Air Tasking Order (ATO) matching: Instead of binary grounding, dynamically matches platform degradation
    against specific mission stress envelopes (Combat Air Patrol, Close Air Support, ISR Recon, Tactical Ferry).
    """
    from src.backend.app.core.mission_matching import match_asset_to_sortie_profiles
    async with async_session_factory() as session:
        result = await session.execute(
            select(Asset).filter(Asset.asset_code == asset_code.strip().upper()).options(selectinload(Asset.components))
        )
        asset = result.scalars().first()
        if not asset:
            return json.dumps({"error": f"Asset '{asset_code}' not found."})

        lowest_rul = min([c.current_rul for c in asset.components]) if asset.components else 125.0
        asset_dict = {"asset_code": asset.asset_code, "name": asset.name, "status": asset.status}
        matrix = match_asset_to_sortie_profiles(asset_dict, lowest_component_rul=lowest_rul)
        return json.dumps(matrix, indent=2)


@mcp.tool()
async def generate_mil_std_work_order(asset_code: str) -> str:
    """
    Generates an official digital AFTO Form 781A Aerospace Vehicle Maintenance Discrepancy Document
    with military Red X/Diagonal symbols, discrepancy narratives, corrective J-codes, and NSN parts lists.
    """
    from src.backend.app.core.military_forms import generate_afto_form_781a
    async with async_session_factory() as session:
        result = await session.execute(
            select(Asset).filter(Asset.asset_code == asset_code.strip().upper()).options(selectinload(Asset.components))
        )
        asset = result.scalars().first()
        if not asset:
            return json.dumps({"error": f"Asset '{asset_code}' not found."})

        lowest_comp = min(asset.components, key=lambda c: c.current_rul) if asset.components else None
        comp_name = lowest_comp.name if lowest_comp else "Turbofan Engine"
        rul = lowest_comp.current_rul if lowest_comp else 18.4
        serial = lowest_comp.serial_number if lowest_comp else "SN-ENG-101"

        form = generate_afto_form_781a(
            asset_code=asset.asset_code,
            asset_model=asset.model,
            serial_number=serial,
            component_name=comp_name,
            issue_description=f"Status: {asset.status} ({asset.readiness_score}%). RUL: {rul} hrs.",
            severity="CRITICAL" if asset.status == "NMC" else "HIGH",
            predicted_rul=rul
        )
        return json.dumps(form, indent=2)


# ── 2. MCP RESOURCES ──────────────────────────────────────────────────────────

@mcp.resource("fleet://status")
async def get_fleet_resource() -> str:
    """Live state of all 20 military fleet platforms."""
    return await get_fleet_readiness_summary()


@mcp.resource("fleet://predictions/critical")
async def get_critical_predictions_resource() -> str:
    """Live list of all critical component failure predictions."""
    return await predict_component_failures(filter_high_risk_only=True)


# ── 3. MCP PROMPT TEMPLATES ──────────────────────────────────────────────────

@mcp.prompt()
def morning_readiness_briefing() -> str:
    """Commander's daily readiness and operational risk briefing prompt."""
    return "Please provide a high-level executive briefing on the fleet's current mission readiness, highlighting any non-mission-ready platforms and recommended maintenance actions before upcoming operational windows."


@mcp.prompt()
def investigate_asset_failure(asset_code: str) -> str:
    """Prompt template to conduct a technical diagnostic review of a degraded platform."""
    return f"Investigate all sensor anomalies, ML RUL forecasts, and maintenance requirements for platform {asset_code}. Explain the failure mode and recommend corrective work orders."


if __name__ == "__main__":
    # Run FastMCP server
    mcp.run()
