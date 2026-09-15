"""
Integration Tests for FastMCP Server & Autonomous Copilot Tools.
Verifies all 11 MCP tools return real structured defense data, and tests
multi-step copilot decision workflows.
"""

import json
import pytest
from src.backend.app.mcp.server import mcp


@pytest.mark.asyncio
async def test_all_core_mcp_tools_directly():
    """Verifies that all core MCP tools execute and return valid JSON structures."""
    # 1. get_fleet_readiness_summary
    res = await mcp.call_tool("get_fleet_readiness_summary", {})
    summary = json.loads(res.content[0].text if hasattr(res, "content") else str(res))
    assert "total_assets" in summary
    assert "fmc_count" in summary
    assert "pmc_count" in summary
    assert "nmc_count" in summary

    # 2. get_asset_readiness
    res = await mcp.call_tool("get_asset_readiness", {"asset_code": "F16-VIPER-101"})
    asset_data = json.loads(res.content[0].text if hasattr(res, "content") else str(res))
    assert asset_data["asset_code"] == "F16-VIPER-101"
    assert "condition_readiness_score" in asset_data

    # 3. predict_component_failures
    res = await mcp.call_tool("predict_component_failures", {"filter_high_risk_only": True})
    preds = json.loads(res.content[0].text if hasattr(res, "content") else str(res))
    assert "predictions" in preds

    # 4. explain_readiness_issue
    res = await mcp.call_tool("explain_readiness_issue", {"asset_code": "F16-VIPER-101"})
    explanation = res.content[0].text if hasattr(res, "content") else str(res)
    assert len(explanation) > 20
    assert "F16-VIPER-101" in explanation or "readiness" in explanation.lower()

    # 5. generate_maintenance_plan
    res = await mcp.call_tool("generate_maintenance_plan", {"mission_window_hours": 48.0})
    plan = json.loads(res.content[0].text if hasattr(res, "content") else str(res))
    assert "prioritized_work_orders" in plan

    # 6. get_sensor_anomalies
    res = await mcp.call_tool("get_sensor_anomalies", {"asset_code": "F16-VIPER-101"})
    anomalies = json.loads(res.content[0].text if hasattr(res, "content") else str(res))
    assert "anomalies" in anomalies

    # 7. search_maintenance_history
    res = await mcp.call_tool("search_maintenance_history", {"query_keyword": "engine"})
    records = json.loads(res.content[0].text if hasattr(res, "content") else str(res))
    assert isinstance(records, list)

    # 8. get_mission_readiness_forecast
    res = await mcp.call_tool("get_mission_readiness_forecast", {})
    forecast = json.loads(res.content[0].text if hasattr(res, "content") else str(res))
    assert isinstance(forecast, list)

    # 9. simulate_mission_stress
    res = await mcp.call_tool("simulate_mission_stress", {
        "asset_code": "F16-VIPER-101",
        "mission_profile": "DESERT_HEAT",
        "sortie_duration_hours": 6.0,
        "sortie_g_rating": 7.0
    })
    sim = json.loads(res.content[0].text if hasattr(res, "content") else str(res))
    assert sim["model_type"] == "COUNTERFACTUAL_WHAT_IF_SIMULATION"
    assert sim["is_validated_physical_twin"] is False
    assert "mission_survivability_probability" in sim

    # 10. get_mission_reallocation_matrix
    res = await mcp.call_tool("get_mission_reallocation_matrix", {"asset_code": "F16-VIPER-101"})
    matrix = json.loads(res.content[0].text if hasattr(res, "content") else str(res))
    assert "cleared_sortie_profiles" in matrix

    # 11. generate_mil_std_work_order
    res = await mcp.call_tool("generate_mil_std_work_order", {"asset_code": "F16-VIPER-101"})
    afto = json.loads(res.content[0].text if hasattr(res, "content") else str(res))
    assert afto["form_id"] == "AFTO-781A"
    assert "discrepancy_block" in afto


@pytest.mark.asyncio
async def test_bob_multi_step_workflow_platform_risk_investigation():
    """
    Simulates multi-step autonomous Bob copilot investigation:
    Step 1: Check fleet readiness summary.
    Step 2: Identify degraded asset.
    Step 3: Retrieve diagnostic component anomalies.
    Step 4: Generate watsonx diagnostic explanation.
    Step 5: Generate AFTO 781A military discrepancy document.
    """
    # Step 1: Fleet summary
    res1 = await mcp.call_tool("get_fleet_readiness_summary", {})
    summary = json.loads(res1.content[0].text if hasattr(res1, "content") else str(res1))
    assert summary["total_assets"] > 0

    # Step 2: Get specific degraded asset
    target_code = "F16-VIPER-101"
    res2 = await mcp.call_tool("get_asset_readiness", {"asset_code": target_code})
    asset_data = json.loads(res2.content[0].text if hasattr(res2, "content") else str(res2))
    assert asset_data["asset_code"] == target_code

    # Step 3: Sensor anomalies for target
    res3 = await mcp.call_tool("get_sensor_anomalies", {"asset_code": target_code})
    anom_data = json.loads(res3.content[0].text if hasattr(res3, "content") else str(res3))
    assert "anomalies_count" in anom_data

    # Step 4: Diagnostic explanation
    res4 = await mcp.call_tool("explain_readiness_issue", {"asset_code": target_code})
    explanation = res4.content[0].text if hasattr(res4, "content") else str(res4)
    assert len(explanation) > 10

    # Step 5: Generate AFTO Form 781A
    res5 = await mcp.call_tool("generate_mil_std_work_order", {"asset_code": target_code})
    form = json.loads(res5.content[0].text if hasattr(res5, "content") else str(res5))
    assert form["form_id"] == "AFTO-781A"
    assert form["platform_data"]["tail_number"] == target_code
