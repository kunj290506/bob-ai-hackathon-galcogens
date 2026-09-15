# Solution Overview — D1 Mission Readiness & Predictive Maintenance Copilot

## What We Built
The **D1 Mission Readiness & Predictive Maintenance Copilot** is a production-grade, modular monolithic platform engineered for military fleet commanders, maintenance officers, and flight-line technicians. 

The system bridges raw aerospace sensor telemetry with autonomous agentic intelligence. By ingesting HUMS sensor data and historical service logs, the platform:
1. **Accurately Classifies Platform Readiness:** Evaluates platforms into military standard Fully Mission Capable (**FMC**), Partially Mission Capable (**PMC**), and Non-Mission Capable (**NMC**) states.
2. **Forecasts Component Remaining Useful Life (RUL):** Uses GPU-accelerated XGBoost models trained on the **NASA C-MAPSS** turbofan degradation dataset to predict exact cycles/hours to failure.
3. **Explains Root Causes in Natural Language:** Connects to **IBM watsonx.ai Granite 3-8B** to explain thermal creep, vibration harmonics, and failure mechanisms in plain language.
4. **Optimizes Prioritized Maintenance Plans:** Ranks work orders dynamically based on mission criticality, technician labor capacity, and failure urgency before upcoming deployment windows.
5. **Counterfactual Mission Stress & Environmental Twin:** Ingests theater conditions (Desert Heat 45°C, Sand/Dust particulate ingestion, Sub-Zero Arctic, and 9G combat air maneuvering) to forecast accelerated wear multipliers and mission survivability probability before platform commitment.
6. **Mission-Adaptive Sortie Re-allocation (ATO Matching):** Dynamically matches degraded airframes (PMC) to secondary low-stress sortie profiles (Reconnaissance, Tactical Ferry, Ground Alert) instead of binary grounding, preserving combat generation tempo.
7. **Automated Digital AFTO Form 781A Discrepancy Generator:** Auto-dispatches official defense maintenance discrepancy sheets with Red X grounding / Red Diagonal symbols, automated Job Control Numbers (JCN), military J-codes, and DLA National Stock Number (NSN) parts requisitions.
8. **Empowers Operators via IBM Bob Copilot:** Integrates directly with **IBM Bob** through the **Model Context Protocol (MCP)**, exposing 11 specialized operational tools.

## How It Works
```
[HUMS Sensor Telemetry] ──> [Feature Engineering: 108 Channels]
                                     │
                                     ▼
                      [GPU-Accelerated XGBoost Regressor]
                                     │
                                     ├──> Predicted RUL (Cycles / Hours)
                                     └──> Unsupervised Isolation Forest (Anomaly Score)
                                                 │
                                                 ▼
[Readiness Engine] <────────────────── [Subsystem Condition Scorer]
        │
        ├──> FMC / PMC / NMC Status Assessment
        ├──> Conflict Detection against Mission Windows (e.g. 48-hr horizon)
        └──> Prioritized Work Order Dispatch
                 │
                 ▼
[FastMCP Server /mcp] <─── [IBM Bob Copilot] ───> [watsonx.ai Granite 3-8B]
        │                                                     │
        └──> 8 Operational Defense Tools                      └──> Natural Language
             (Fleet, Diagnostics, Planning, History)                Readiness Explanations
```

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **Modular Monolith Architecture** | Eliminates distributed network overhead, guarantees ACID transactional integrity across flight logs and maintenance dispatches, and provides a single zero-friction deployable container. |
| **NASA C-MAPSS Turbofan Benchmark** | Gold-standard aerospace benchmark (21 sensor channels: turbine temperatures, fan speeds, bypass ratios) ensuring models reflect real aerodynamic propulsion degradation physics. |
| **FastMCP as the Copilot Protocol** | Makes IBM Bob load-bearing: Bob autonomously executes tools (`get_fleet_readiness_summary`, `explain_readiness_issue`, `generate_maintenance_plan`) over streamable HTTP. |
| **Intelligent Dual-Mode watsonx Engine** | Guarantees seamless demonstration: calls live Granite 3-8B when IBM Cloud API keys are provided, and falls back to a deterministic offline Granite simulator if keys are absent (zero crash risk). |
| **Pure JavaScript / JSX Frontend** | Strict adherence to hackathon team directives; delivers a responsive, dark-mode military tactical command center without TypeScript compilation complexity. |

## IBM Technologies Used

- **IBM Bob (Project Bob):** Acts as the autonomous operational copilot. Connects via `.bob/mcp.json` to our FastMCP endpoint at `http://localhost:8000/mcp`, enabling conversational fleet management, failure prediction, and work order generation.
- **IBM watsonx.ai:** Generates natural language diagnostic briefings and explanations using the `ibm/granite-3-8b-instruct` foundation model via the official Python SDK.
- **Model Context Protocol (FastMCP):** Implements Anthropic / IBM standard MCP tool interfaces exposing 11 specialized defense maintenance tools, resources, and prompt templates.
