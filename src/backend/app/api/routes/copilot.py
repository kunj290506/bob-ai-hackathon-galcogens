"""Bob Copilot conversational and diagnostic endpoints."""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.core.readiness import calculate_asset_readiness, calculate_fleet_readiness_summary
from src.backend.app.db.base import get_db
from src.backend.app.db.models import Asset, MissionWindow
from src.backend.app.schemas.maintenance import CopilotChatRequest, CopilotChatResponse
from src.backend.app.services.watsonx_service import WatsonxService

router = APIRouter(prefix="/copilot", tags=["Bob Copilot"])
watsonx = WatsonxService.get_instance()


@router.post("/chat", response_model=CopilotChatResponse)
async def chat_with_copilot(req: CopilotChatRequest, session: AsyncSession = Depends(get_db)):
    """Conversational endpoint interacting with the IBM Bob Copilot & watsonx Granite models."""
    context = {}
    tools_used = []

    if req.asset_code:
        tools_used.append("get_asset_readiness")
        tools_used.append("explain_readiness_issue")
        result = await session.execute(
            select(Asset).filter(Asset.asset_code == req.asset_code.strip().upper()).options(selectinload(Asset.components))
        )
        asset = result.scalars().first()
        if asset:
            components_data = [
                {
                    "name": c.name,
                    "component_type": c.component_type,
                    "current_rul": c.current_rul,
                    "risk_level": c.risk_level,
                    "status": c.status
                } for c in asset.components
            ]
            readiness = calculate_asset_readiness(components_data)
            answer = await watsonx.explain_readiness_issue(
                asset_code=asset.asset_code,
                asset_name=asset.name,
                status=readiness["status"],
                score=readiness["readiness_score"],
                issues=readiness["critical_issues"] + readiness["warnings"]
            )
            return CopilotChatResponse(response=answer, tools_used=tools_used, timestamp=datetime.utcnow())

    # General query
    tools_used.append("get_fleet_readiness_summary")
    answer = await watsonx.answer_copilot_query(req.message, context)
    return CopilotChatResponse(response=answer, tools_used=tools_used, timestamp=datetime.utcnow())


@router.get("/briefing")
async def get_commander_briefing(session: AsyncSession = Depends(get_db)):
    """Generates an instant high-level commander's daily readiness briefing."""
    result = await session.execute(select(Asset).options(selectinload(Asset.components)))
    assets = result.scalars().all()
    assets_data = [
        {
            "id": a.id,
            "asset_code": a.asset_code,
            "name": a.name,
            "components": [
                {
                    "name": c.name,
                    "component_type": c.component_type,
                    "current_rul": c.current_rul,
                    "risk_level": c.risk_level
                } for c in a.components
            ]
        } for a in assets
    ]
    summary = calculate_fleet_readiness_summary(assets_data)
    missions_res = await session.execute(select(MissionWindow))
    missions = [
        {"title": m.title, "priority": m.priority, "required_assets_count": m.required_assets_count, "start_time": m.start_time.isoformat() if hasattr(m.start_time, "isoformat") else str(m.start_time)}
        for m in missions_res.scalars().all()
    ]

    briefing_text = await watsonx.generate_fleet_briefing(summary, missions)
    return {
        "briefing": briefing_text,
        "summary": summary,
        "generated_at": datetime.utcnow().isoformat()
    }


@router.get("/explain/{asset_code}")
async def explain_asset(asset_code: str, session: AsyncSession = Depends(get_db)):
    """Returns detailed watsonx.ai diagnostic explanation for why an asset is degraded or failing."""
    result = await session.execute(
        select(Asset).filter(Asset.asset_code == asset_code.strip().upper()).options(selectinload(Asset.components))
    )
    asset = result.scalars().first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    components_data = [
        {
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
    return {
        "asset_code": asset.asset_code,
        "name": asset.name,
        "status": readiness["status"],
        "readiness_score": readiness["readiness_score"],
        "explanation": explanation
    }


@router.post("/simulate-stress")
async def simulate_stress_endpoint(
    asset_code: str = "F16-VIPER-101",
    mission_profile: str = "DESERT_HEAT",
    sortie_duration_hours: float = 6.0,
    sortie_g_rating: float = 7.0,
    session: AsyncSession = Depends(get_db)
):
    """Counterfactual stress simulator evaluating accelerated wear and mission survivability."""
    from src.backend.app.core.simulation import simulate_mission_stress as run_simulation
    result = await session.execute(
        select(Asset).filter(Asset.asset_code == asset_code.strip().upper()).options(selectinload(Asset.components))
    )
    asset = result.scalars().first()
    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset '{asset_code}' not found")

    nominal_telemetry = {
        "unit_nr": 1, "time_cycles": 1,
        "s_2": 642.3, "s_3": 1586.9, "s_4": 1402.8, "s_7": 553.9,
        "s_8": 2388.0, "s_9": 9060.0, "s_11": 47.3, "s_12": 521.9,
        "s_13": 2388.0, "s_14": 8130.0, "s_15": 8.41, "s_17": 393.0,
        "s_20": 38.9, "s_21": 23.3
    }
    sim_res = run_simulation(
        nominal_telemetry,
        mission_profile=mission_profile,
        mission_duration_hours=sortie_duration_hours,
        sortie_g_rating=sortie_g_rating
    )
    sim_res["asset_code"] = asset.asset_code
    sim_res["asset_name"] = asset.name
    return sim_res


@router.get("/sortie-matrix/{asset_code}")
async def get_sortie_matrix(asset_code: str, session: AsyncSession = Depends(get_db)):
    """Dynamically matches platform degradation against Air Tasking Order (ATO) mission profiles."""
    from src.backend.app.core.mission_matching import match_asset_to_sortie_profiles
    result = await session.execute(
        select(Asset).filter(Asset.asset_code == asset_code.strip().upper()).options(selectinload(Asset.components))
    )
    asset = result.scalars().first()
    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset '{asset_code}' not found")

    lowest_rul = min([c.current_rul for c in asset.components]) if asset.components else 125.0
    asset_dict = {"asset_code": asset.asset_code, "name": asset.name, "status": asset.status}
    return match_asset_to_sortie_profiles(asset_dict, lowest_component_rul=lowest_rul)


@router.get("/form-781a/{asset_code}")
async def get_military_form(asset_code: str, session: AsyncSession = Depends(get_db)):
    """Generates official AFTO Form 781A Aerospace Vehicle Maintenance Discrepancy Document."""
    from src.backend.app.core.military_forms import generate_afto_form_781a
    result = await session.execute(
        select(Asset).filter(Asset.asset_code == asset_code.strip().upper()).options(selectinload(Asset.components))
    )
    asset = result.scalars().first()
    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset '{asset_code}' not found")

    lowest_comp = min(asset.components, key=lambda c: c.current_rul) if asset.components else None
    comp_name = lowest_comp.name if lowest_comp else "Turbofan Engine"
    rul = lowest_comp.current_rul if lowest_comp else 18.4
    serial = lowest_comp.serial_number if lowest_comp else "SN-ENG-101"

    return generate_afto_form_781a(
        asset_code=asset.asset_code,
        asset_model=asset.model,
        serial_number=serial,
        component_name=comp_name,
        issue_description=f"Status: {asset.status} ({asset.readiness_score}%). RUL: {rul} hrs.",
        severity="CRITICAL" if asset.status == "NMC" else "HIGH",
        predicted_rul=rul
    )

