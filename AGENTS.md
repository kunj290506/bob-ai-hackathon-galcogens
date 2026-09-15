# AGENTS.md — IBM Bob Agent System & Copilot Directives

## 1. Project Overview
- **Project:** D1 Mission Readiness & Predictive Maintenance Copilot
- **Team:** Galcogens (Track: AI)
- **Domain:** Defense Aerospace & Ground Fleet Condition-Based Maintenance (CBM+)
- **Architecture:** Modular Monolith (FastAPI + React JSX + SQLite/PostgreSQL + FastMCP + watsonx.ai)

## 2. IBM Bob Copilot & MCP Tools
IBM Bob acts as the autonomous operational copilot connecting to the local MCP server endpoint:
- **MCP Endpoint:** `http://localhost:8000/mcp`
- **Config:** `.bob/mcp.json`

### Available Tools:
1. `get_fleet_readiness_summary()`: Returns FMC/PMC/NMC counts, rates, and fleet health index.
2. `get_asset_readiness(asset_code)`: Detailed status, readiness score, and component diagnostics for a platform.
3. `predict_component_failures(filter_high_risk_only)`: RUL forecasts, confidence bounds, and imminent failure alerts.
4. `explain_readiness_issue(asset_code)`: watsonx.ai Granite-powered natural language explanations of readiness degradation.
5. `generate_maintenance_plan(mission_window_hours)`: Ranked, prioritized turnaround work orders optimized against mission deadlines.
6. `get_sensor_anomalies(asset_code)`: Telemetry anomalies (thermal creep, vibration spikes, pressure drops).
7. `search_maintenance_history(query_keyword)`: Search historical maintenance actions and part replacements.
8. `get_mission_readiness_forecast()`: Mission capability assessment against upcoming deployment windows.
9. `simulate_mission_stress(asset_code, mission_profile, sortie_duration_hours, sortie_g_rating)`: Physics-informed environmental stress simulator (ambient temp, sand/dust ingestion, 9G turns).
10. `get_mission_reallocation_matrix(asset_code)`: Air Tasking Order (ATO) sortie matching engine for degraded assets.
11. `generate_mil_std_work_order(asset_code)`: Digital AFTO Form 781A discrepancy document with Red X / Red Diagonal symbols and NSN parts requisitions.

## 3. Military Readiness Semantics
- **FMC (Fully Mission Capable):** Asset can perform all primary combat missions (readiness score >= 85%).
- **PMC (Partially Mission Capable):** Asset has degraded secondary systems (readiness score 50-84%).
- **NMC (Non-Mission Capable):** Asset is grounded due to imminent component failure or critical safety violation (score < 50%).

## 4. Architectural Rules for Agents
- Backend code belongs in `src/backend/app/`.
- Frontend code belongs in `src/frontend/` and must strictly use pure JavaScript / JSX (no TypeScript).
- All ML models are stored in `src/backend/app/ml/weights/` and run GPU-accelerated (CUDA) or multi-threaded CPU.
