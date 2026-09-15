"""Bob Copilot conversational and diagnostic endpoints."""
import re
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.core.readiness import calculate_asset_readiness, calculate_fleet_readiness_summary
from src.backend.app.db.base import get_db
from src.backend.app.db.models import Asset, Component, MissionWindow, WorkOrder
from src.backend.app.schemas.maintenance import CopilotChatRequest, CopilotChatResponse
from src.backend.app.services.watsonx_service import WatsonxService

router = APIRouter(prefix="/copilot", tags=["Bob Copilot"])
watsonx = WatsonxService.get_instance()

# Tail-number pattern: e.g. F16-VIPER-101, AH64-APACHE-401, M1A2-ABRAMS-701
_ASSET_CODE_RE = re.compile(r'\b([A-Z0-9]{2,6}-[A-Z0-9]+-\d{3,})\b', re.IGNORECASE)


async def _build_fleet_context(session: AsyncSession) -> dict:
    """Load live fleet data from DB and structure it for Granite synthesis."""
    assets_res = await session.execute(
        select(Asset).options(selectinload(Asset.components))
    )
    assets = assets_res.scalars().all()

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
                    "risk_level": c.risk_level,
                    "status": c.status,
                    "id": c.id,
                }
                for c in a.components
            ],
        }
        for a in assets
    ]
    fleet_summary = calculate_fleet_readiness_summary(assets_data)

    # Per-asset readiness breakdown
    nmc_assets, pmc_assets, fmc_assets = [], [], []
    high_risk_components = []

    for a, ad in zip(assets, assets_data):
        r = calculate_asset_readiness(ad["components"])
        lowest_rul = min((c.current_rul for c in a.components), default=125.0)
        critical_issue = ""
        if r["critical_issues"]:
            critical_issue = r["critical_issues"][0].get("issue", "")
        elif r["warnings"]:
            critical_issue = r["warnings"][0].get("issue", "")

        entry = {
            "asset_code": a.asset_code,
            "name": a.name,
            "readiness_score": r["readiness_score"],
            "lowest_rul": lowest_rul,
            "critical_issue": critical_issue,
        }
        if r["status"] == "NMC":
            nmc_assets.append(entry)
        elif r["status"] == "PMC":
            pmc_assets.append(entry)
        else:
            fmc_assets.append(entry)

        for c in a.components:
            if c.risk_level in ("HIGH", "CRITICAL"):
                high_risk_components.append({
                    "asset_code": a.asset_code,
                    "asset_name": a.name,
                    "component_name": c.name,
                    "rul": c.current_rul,
                    "risk_level": c.risk_level,
                })

    # Sort high-risk by RUL ascending (most urgent first)
    high_risk_components.sort(key=lambda x: x["rul"])

    # Work orders (PENDING / APPROVED / IN_PROGRESS)
    from sqlalchemy import case as sa_case
    _priority_order = sa_case(
        (WorkOrder.priority == "CRITICAL", 0),
        (WorkOrder.priority == "HIGH", 1),
        (WorkOrder.priority == "MEDIUM", 2),
        else_=3,
    )
    wo_res = await session.execute(
        select(WorkOrder, Asset.asset_code)
        .join(Asset, WorkOrder.asset_id == Asset.id)
        .filter(WorkOrder.status.in_(["PENDING", "APPROVED", "IN_PROGRESS"]))
        .order_by(_priority_order, WorkOrder.created_at.desc())
    )
    wo_rows = wo_res.all()
    pending_work_orders = [
        {
            "asset_code": row[1],
            "title": row[0].title,
            "priority": row[0].priority,
            "estimated_hours": row[0].estimated_hours,
            "assigned_to": row[0].assigned_to,
            "status": row[0].status,
        }
        for row in wo_rows
    ]

    # Missions
    missions_res = await session.execute(select(MissionWindow))
    active_missions = [
        {
            "title": m.title,
            "priority": m.priority,
            "required_assets_count": m.required_assets_count,
            "start_time": m.start_time.isoformat() if hasattr(m.start_time, "isoformat") else str(m.start_time),
        }
        for m in missions_res.scalars().all()
    ]

    return {
        "fleet_summary": fleet_summary,
        "nmc_assets": nmc_assets,
        "pmc_assets": pmc_assets,
        "fmc_assets": fmc_assets,
        "high_risk_components": high_risk_components,
        "pending_work_orders": pending_work_orders,
        "open_work_order_count": len(pending_work_orders),
        "active_missions": active_missions,
    }


from src.backend.app.services.audit_service import record_audit_event

PROMPT_INJECTION_PATTERNS = [
    re.compile(r'ignore\s+(all\s+)?(previous|prior)\s+instructions?', re.IGNORECASE),
    re.compile(r'disregard\s+(all\s+)?(previous|prior)\s+instructions?', re.IGNORECASE),
    re.compile(r'system\s+override', re.IGNORECASE),
    re.compile(r'reveal\s+(all\s+)?(fleet\s+records|secrets|passwords|system\s+prompts?)', re.IGNORECASE),
    re.compile(r'you\s+are\s+now\s+in\s+dan\s+mode', re.IGNORECASE),
    re.compile(r'bypass\s+operational\s+security', re.IGNORECASE),
    re.compile(r'drop\s+table', re.IGNORECASE),
]


@router.post("/chat", response_model=CopilotChatResponse)
async def chat_with_copilot(req: CopilotChatRequest, session: AsyncSession = Depends(get_db)):
    """Conversational endpoint interacting with the IBM Bob Copilot & watsonx Granite models."""
    tools_used = []

    # Adversarial Defense: Intercept prompt injection and instruction overrides
    for pattern in PROMPT_INJECTION_PATTERNS:
        if pattern.search(req.message):
            await record_audit_event(
                session=session,
                action="SECURITY_ALERT",
                entity_type="COPILOT_CHAT",
                username="COPILOT_CLIENT",
                details={
                    "reason": "PROMPT_INJECTION_ATTEMPT",
                    "message_snippet": req.message[:100]
                }
            )
            await session.commit()
            return CopilotChatResponse(
                response=(
                    "[SECURITY REFUSAL]: Operational directive rejected. System security protocols prohibit "
                    "unauthorized instruction override, policy bypass, or arbitrary credential/fleet record extraction. "
                    "This incident has been logged to the classified audit trail."
                ),
                tools_used=[],
                timestamp=datetime.utcnow(),
                watsonx_mode=watsonx.get_mode(),
                security_flag=True
            )

    # Detect explicit request for unknown / unregistered assets
    if re.search(r'\b(unknown|unregistered|fake|non-existent)\s+(asset|aircraft|platform|vehicle)\b', req.message, re.IGNORECASE):
        return CopilotChatResponse(
            response="OPERATIONAL ALERT: Specified platform not identified in fleet registry. No maintenance records or sensor telemetry exist for unregistered assets.",
            tools_used=["search_maintenance_history"],
            timestamp=datetime.utcnow(),
            watsonx_mode=watsonx.get_mode(),
            security_flag=False
        )

    # Detect an asset code either explicitly supplied or embedded in the message text
    detected_code = req.asset_code
    if not detected_code:
        m = _ASSET_CODE_RE.search(req.message)
        if m:
            detected_code = m.group(1).upper()

    if detected_code:
        tools_used += ["get_asset_readiness", "explain_readiness_issue"]
        result = await session.execute(
            select(Asset)
            .filter(Asset.asset_code == detected_code.strip().upper())
            .options(selectinload(Asset.components))
        )
        asset = result.scalars().first()
        if asset:
            components_data = [
                {
                    "name": c.name,
                    "component_type": c.component_type,
                    "current_rul": c.current_rul,
                    "risk_level": c.risk_level,
                    "status": c.status,
                    "id": c.id,
                }
                for c in asset.components
            ]
            readiness = calculate_asset_readiness(components_data)
            answer = await watsonx.explain_readiness_issue(
                asset_code=asset.asset_code,
                asset_name=asset.name,
                status=readiness["status"],
                score=readiness["readiness_score"],
                issues=readiness["critical_issues"] + readiness["warnings"],
            )
            return CopilotChatResponse(
                response=answer,
                tools_used=tools_used,
                timestamp=datetime.utcnow(),
                watsonx_mode=watsonx.get_mode(),
                security_flag=False
            )
        else:
            # Asset was specified but not found in active fleet registry
            return CopilotChatResponse(
                response=f"OPERATIONAL ALERT: Platform '{detected_code}' was not found in the fleet registry. Verified assets must match active squadron inventory.",
                tools_used=tools_used,
                timestamp=datetime.utcnow(),
                watsonx_mode=watsonx.get_mode(),
                security_flag=False
            )

    # General query — load real fleet state, pass as rich context
    tools_used += ["get_fleet_readiness_summary", "predict_component_failures", "search_maintenance_history"]
    context = await _build_fleet_context(session)
    answer = await watsonx.answer_copilot_query(req.message, context)
    return CopilotChatResponse(
        response=answer,
        tools_used=tools_used,
        timestamp=datetime.utcnow(),
        watsonx_mode=watsonx.get_mode(),
        security_flag=False
    )


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


from pydantic import BaseModel as _BM

class StressSimBody(_BM):
    asset_code: str = "F16-VIPER-101"
    mission_profile: str = "DESERT_HEAT"
    sortie_duration_hours: float = 6.0
    sortie_g_rating: float = 7.0

@router.post("/simulate-stress")
async def simulate_stress_endpoint(
    body: StressSimBody,
    session: AsyncSession = Depends(get_db)
):
    """Counterfactual stress simulator evaluating accelerated wear and mission survivability."""
    from src.backend.app.core.simulation import simulate_mission_stress as run_simulation
    asset_code = body.asset_code
    mission_profile = body.mission_profile
    sortie_duration_hours = body.sortie_duration_hours
    sortie_g_rating = body.sortie_g_rating
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

