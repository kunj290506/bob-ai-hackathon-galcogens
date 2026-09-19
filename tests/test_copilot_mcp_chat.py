"""
Tests verifying that Bob Copilot chat ACTUALLY invokes the FastMCP tools
and returns the executed tool names in tools_used.
"""

import pytest
from src.backend.app.db.base import async_session_factory
from src.backend.app.api.routes.copilot import chat_with_copilot
from src.backend.app.schemas.maintenance import CopilotChatRequest


@pytest.mark.asyncio
async def test_copilot_invokes_fleet_readiness_tool():
    async with async_session_factory() as session:
        req = CopilotChatRequest(message="What is the overall fleet readiness summary?")
        res = await chat_with_copilot(req, session)
        assert "get_fleet_readiness_summary" in res.tools_used
        assert "Fleet Posture" in res.response or "FMC" in res.response
        assert res.watsonx_mode in ["OFFLINE_AUTONOMOUS_MCP", "LIVE_GEMINI_MCP"]


@pytest.mark.asyncio
async def test_copilot_invokes_predict_component_failures_tool():
    async with async_session_factory() as session:
        req = CopilotChatRequest(message="Predict component failures and show RUL hours.")
        res = await chat_with_copilot(req, session)
        assert "predict_component_failures" in res.tools_used
        assert "RUL" in res.response or "Failure Forecast" in res.response


@pytest.mark.asyncio
async def test_copilot_invokes_asset_diagnostics_tools():
    async with async_session_factory() as session:
        req = CopilotChatRequest(message="Provide full tactical diagnostics for F16-VIPER-101.")
        res = await chat_with_copilot(req, session)
        assert "get_asset_readiness" in res.tools_used
        assert "explain_readiness_issue" in res.tools_used
        assert "F16-VIPER-101" in res.response


@pytest.mark.asyncio
async def test_copilot_invokes_maintenance_plan_tool():
    async with async_session_factory() as session:
        req = CopilotChatRequest(message="Generate prioritized maintenance turnaround plan for the next 48 hours.")
        res = await chat_with_copilot(req, session)
        assert "generate_maintenance_plan" in res.tools_used
        assert "Work Orders" in res.response or "Maintenance Turnaround" in res.response


@pytest.mark.asyncio
async def test_copilot_invokes_simulation_tool():
    async with async_session_factory() as session:
        req = CopilotChatRequest(message="Simulate 9G combat turns and desert heat stress on F16-VIPER-101.")
        res = await chat_with_copilot(req, session)
        assert "simulate_mission_stress" in res.tools_used
        assert "Survivability Probability" in res.response or "Wear Multiplier" in res.response


@pytest.mark.asyncio
async def test_copilot_invokes_mission_reallocation_tool():
    async with async_session_factory() as session:
        req = CopilotChatRequest(message="Can we reallocate F16-VIPER-101 to lower stress ATO sorties?")
        res = await chat_with_copilot(req, session)
        assert "get_mission_reallocation_matrix" in res.tools_used
        assert "Air Tasking Order" in res.response or "ATO" in res.response


@pytest.mark.asyncio
async def test_copilot_invokes_afto_781a_tool():
    async with async_session_factory() as session:
        req = CopilotChatRequest(message="Generate AFTO Form 781A discrepancy document with Red X symbol.")
        res = await chat_with_copilot(req, session)
        assert "generate_mil_std_work_order" in res.tools_used
        assert "AFTO-781A" in res.response


@pytest.mark.asyncio
async def test_copilot_nmc_grounded_platforms():
    async with async_session_factory() as session:
        req = CopilotChatRequest(message="Which platforms are NMC / grounded?")
        res = await chat_with_copilot(req, session)
        assert "get_fleet_readiness_summary" in res.tools_used
        # Must list all 3 grounded airframes accurately
        assert "F16-VIPER-101" in res.response
        assert "AH64-APACHE-401" in res.response
        assert "M1A2-ABRAMS-701" in res.response
        assert "3" in res.response


@pytest.mark.asyncio
async def test_copilot_pmc_platforms():
    async with async_session_factory() as session:
        req = CopilotChatRequest(message="Which platforms are PMC?")
        res = await chat_with_copilot(req, session)
        assert "get_fleet_readiness_summary" in res.tools_used
        # Must list the PMC airframes
        assert "F16-VIPER-103" in res.response or "4" in res.response


@pytest.mark.asyncio
async def test_copilot_fmc_cleared_platforms():
    async with async_session_factory() as session:
        req = CopilotChatRequest(message="Which aircraft are NOT grounded and cleared to fly?")
        res = await chat_with_copilot(req, session)
        assert "get_fleet_readiness_summary" in res.tools_used
        assert "FMC COMBAT-CLEARED PLATFORMS" in res.response
        assert "13" in res.response


@pytest.mark.asyncio
async def test_copilot_flight_clearance_verdict_denied():
    async with async_session_factory() as session:
        req = CopilotChatRequest(message="Can AH64-APACHE-401 fly combat missions tomorrow?")
        res = await chat_with_copilot(req, session)
        assert "get_asset_readiness" in res.tools_used
        assert "FLIGHT CLEARANCE: DENIED" in res.response
        assert "AH64-APACHE-401" in res.response


@pytest.mark.asyncio
async def test_copilot_sensor_anomalies_tool():
    async with async_session_factory() as session:
        req = CopilotChatRequest(message="Check sensor anomalies and vibration for AH64-APACHE-401")
        res = await chat_with_copilot(req, session)
        assert "get_sensor_anomalies" in res.tools_used
        assert "SENSOR ANOMALY AUDIT" in res.response


@pytest.mark.asyncio
async def test_copilot_search_maintenance_history_tool():
    async with async_session_factory() as session:
        req = CopilotChatRequest(message="Show historical maintenance records for F16-VIPER-101")
        res = await chat_with_copilot(req, session)
        assert "search_maintenance_history" in res.tools_used
        assert "HISTORICAL MAINTENANCE" in res.response


@pytest.mark.asyncio
async def test_copilot_out_of_domain_advisory():
    async with async_session_factory() as session:
        req = CopilotChatRequest(message="What is the capital of France?")
        res = await chat_with_copilot(req, session)
        assert "DOMAIN BOUNDARY ADVISORY" in res.response
        assert "not process general internet trivia" in res.response


@pytest.mark.asyncio
async def test_copilot_conversational_courtesy():
    async with async_session_factory() as session:
        req1 = CopilotChatRequest(message="Thank you so much Bob, great job!")
        res1 = await chat_with_copilot(req1, session)
        assert "STANDING BY" in res1.response

        req2 = CopilotChatRequest(message="Goodbye and signing off for the day")
        res2 = await chat_with_copilot(req2, session)
        assert "STANDING DOWN" in res2.response
