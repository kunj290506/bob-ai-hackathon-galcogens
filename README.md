# 🛡️ D1 Mission Readiness & Predictive Maintenance Copilot

> **An enterprise-grade autonomous AI copilot engineered for defense aerospace and ground fleet condition-based maintenance (CBM+), powered by IBM Bob, watsonx.ai Granite 3.0, GPU-accelerated prognostics, and the Model Context Protocol (MCP).**

---

## 👥 Team

| Field | Value |
|---|---|
| **Team Name** | Galcogens |
| **Track** | AI |
| **Team Lead** | Kunj — d24aiml082@charusat.edu.in |
| **Members** | Vedant (23aiml042@charusat.edu.in), Path (23aiml055@charusat.edu.in), Venisha (23dcs134@charusat.edu.in) |

---

## 🎯 Problem Statement

Military organizations cannot reliably determine whether aircraft, vehicles, and combat equipment are genuinely mission-ready. Maintenance runs on fixed calendar intervals regardless of actual component degradation, while onboard HUMS (Health & Usage Monitoring System) sensor streams that could forecast failures weeks in advance sit unanalyzed in data silos. When platforms fail unexpectedly in the field, operational readiness plummets, mission sorties are aborted, and recovery takes weeks. The US military spends **$90 Billion annually** on maintenance — shifting to predictive, condition-based maintenance saves billions and protects human lives.

---

## 💡 Solution

We built the **D1 Mission Readiness & Predictive Maintenance Copilot**, a modular monolithic platform with an embedded **IBM Bob Copilot**. The system ingests HUMS sensor telemetry and historical service records to classify fleet readiness into military-standard **FMC** (Fully Mission Capable), **PMC** (Partially Mission Capable), and **NMC** (Non-Mission Capable) states. 

It predicts component Remaining Useful Life (RUL) using GPU-accelerated XGBoost models trained on the **NASA C-MAPSS** aerospace turbofan degradation benchmark (achieving a verified holdout RMSE of **18.21 cycles**, MAE of **12.75 cycles**, $R^2 = 0.7935$). It connects to **IBM watsonx.ai Granite 3-8B** to explain root-cause degradation in natural language and recommends an optimized, prioritized maintenance turnaround plan to guarantee fleet readiness before upcoming mission launch deadlines.

---

## ✨ Key Features & Tactical Modules

1. **Tactical Command Dashboard (`DashboardOverview.jsx`):** High-contrast executive command center with fleet readiness gauges (FMC/PMC/NMC), live telemetry activity strips, shortfall alerts across active sortie horizons, and immediate triage of grounded airframes.
2. **Fleet Operations Center (`FleetView.jsx`):** Interactive platform inventory grid with multi-squadron filtering, status inspection drawers, airworthiness scores, flight hours, and cycle counts.
3. **Condition-Based Readiness Engine (`ReadinessEngineView.jsx`):** Subsystem-to-platform MIL-STD readiness matrix (Propulsion, Gearbox, Hydraulics, Avionics, Radar) with weighted degradation scoring.
4. **GPU-Accelerated RUL Prognostics (`RULPrognosticsView.jsx`):** Remaining Useful Life regression trained on NASA C-MAPSS turbofan data across 108 engineered condition features with 95% confidence bounds (RMSE 18.21 cycles).
5. **Mission-Aware Maintenance Optimizer (`MaintenanceOptimizerView.jsx`):** Turnaround work orders ranked dynamically by: $\text{Priority} = f(\text{Mission Criticality}, \text{Predicted RUL}, \text{Technician Availability})$ with one-click authorization workflows.
6. **Air Tasking Order (ATO) Sortie Tracker (`MissionsView.jsx`):** Mission readiness monitor matching upcoming deployment windows against capable platforms, identifying asset shortfalls before sortie launch.
7. **What-If Mission Stress & Environmental Twin (`StressSimulatorView.jsx`):** Counterfactual simulation engine evaluating operational degradation under harsh operational theaters (Desert Heat 45°C, Sand/Dust particulate ingestion, Sub-Zero Arctic, and 9G combat air maneuvering) to forecast accelerated wear multipliers ($K_{env}$) and mission survivability probability.
8. **Automated Digital AFTO Form 781A & ATO Matrix (`MilFormsView.jsx`):** Digital compliance with Air Force Technical Order 00-20-1 and DA Form 2404. Automatically dispatches official discrepancy sheets with Red X grounding / Red Diagonal symbols, automated Job Control Numbers (JCN), military J-codes, and DLA National Stock Number (NSN) parts manifests, combined with dynamic ATO sortie re-allocation to save degraded airframes from binary grounding.
9. **watsonx.ai Granite 3-8B Diagnostics (`GraniteDiagnosticsView.jsx`):** Plain-language root cause explanations for thermal creep, vibration anomalies, and failure mechanisms with an intelligent dual-mode fallback.
10. **IBM Bob FastMCP Copilot Drawer (`CopilotChatDrawer.jsx`):** Autonomous conversational assistant connected via the Model Context Protocol (FastMCP at `/mcp`), exposing 11 defense tools for multi-turn operational investigations.
11. **Defense CAC / DoD ID Authentication (`LoginPage.jsx`):** Role-Based Access Control simulating Common Access Card (CAC) authentication across 4 defense roles (Commander, Maintenance Officer, Logistics Planner, Lead Technician).
12. **Public Mission Showcase (`LandingPage.jsx`):** Operational architecture overview highlighting CBM+ metrics, live telemetry strip, and Granite intelligence capabilities.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| **Languages** | Python 3.11, JavaScript (Pure JSX / JS) |
| **Frameworks** | FastAPI, React 18, Tailwind CSS, Vite |
| **IBM Technologies** | IBM Bob, watsonx.ai (Granite 3-8B Instruct), Model Context Protocol (FastMCP) |
| **Machine Learning** | XGBoost (CUDA GPU), Scikit-Learn, Isolation Forest, NASA C-MAPSS Benchmark |
| **Databases** | SQLAlchemy 2.0 (Async), SQLite / PostgreSQL, aiosqlite, asyncpg |
| **DevOps & Testing** | Docker, Docker Compose, Nginx, GitHub Actions |

---

## 📁 Repository Structure

```
├── .bob/                 # IBM Bob MCP configuration (.bob/mcp.json)
├── AGENTS.md             # IBM Bob Agent directives and domain semantics
├── src/
│   ├── backend/          # FastAPI modular monolith, ML models, & FastMCP server
│   │   ├── app/
│   │   │   ├── api/      # REST endpoints (auth, fleet, predictions, maintenance, copilot)
│   │   │   ├── core/     # Readiness scoring, maintenance planner, security, config
│   │   │   ├── db/       # SQLAlchemy 2.0 async models and session management
│   │   │   ├── ml/       # C-MAPSS feature loader, GPU training, anomaly detector, weights
│   │   │   ├── mcp/      # FastMCP server for IBM Bob integration (/mcp)
│   │   │   └── services/ # watsonx.ai Granite service (dual-mode engine)
│   │   └── requirements.txt
│   ├── frontend/         # React 18 pure JSX command dashboard
│   ├── data/             # Database seed scripts (20 military platforms + telemetry)
│   └── .env.example      # Environment variables template
├── docs/                 # Hackathon documentation
│   ├── problem-statement.md
│   ├── solution-overview.md
│   ├── architecture.md
│   └── setup-guide.md
├── demo/                 # Demo artifacts
│   ├── screenshots/      # Application screenshots
│   ├── demo-video-link.txt  # Link to demo walkthrough video
│   └── live-demo-url.txt    # Live deployment status
├── presentation/         # Slide deck
└── submission.yaml       # Structured submission metadata
```

---

## ⚡ How to Run

> **For complete details, see [`docs/setup-guide.md`](docs/setup-guide.md)**

### Quick Local Startup (3 Steps):

```bash
# 1. Install backend dependencies in Python 3.11 virtual environment
py -3.11 -m venv .venv
.\.venv\Scripts\activate
pip install -r src/backend/requirements.txt

# 2. Seed database with realistic military fleet telemetry
$env:PYTHONPATH="."
python src/data/seed.py

# 3. Start Backend & FastMCP Server
uvicorn src.backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

In a separate terminal, launch the frontend:
```bash
cd src/frontend
npm install
npm run dev
```

- **Frontend Command Center:** `http://localhost:5173`
- **FastAPI Interactive Docs:** `http://localhost:8000/docs`
- **FastMCP Server for IBM Bob:** `http://localhost:8000/mcp`

---

## 🧪 Automated Testing & Verification

The core system has **45 automated tests** across 11 test modules covering mathematical readiness boundaries, C-MAPSS RUL inference, defense maintenance state machines, mission-window horizons, and Bob FastMCP tool execution.

```bash
# Run the complete test suite (45 unit & integration tests)
pytest tests/

# Run the official Bobathon submission validator
python scripts/validate_submission.py
```

*Results: 45 passed in ~4.6s with 100% code validation pass.*

---

## 🖥️ Demo

| Artifact | Link |
|---|---|
| 📹 Demo Video | [See demo/demo-video-link.txt](demo/demo-video-link.txt) |
| 🌐 Live Demo | [See demo/live-demo-url.txt](demo/live-demo-url.txt) |
| 🖼️ Screenshots | [See demo/screenshots/](demo/screenshots/) |
| 📊 Presentation | [See presentation/slides.pdf](presentation/) |

---

## ⚠️ Known Limitations

- **Simulated Bus Telemetry:** Sensor streams are mapped from real run-to-failure NASA C-MAPSS turbofan data rather than a physical MIL-STD-1553 aircraft hardware bus.
- **Dual-Mode AI Engine:** If an evaluator does not provide active IBM Cloud credentials in `.env`, the system activates an offline deterministic Granite 3-8B simulation engine to guarantee a crash-free experience.
- **Authentication Bypass in Dev:** Token requirements default to Commander role in development mode to permit frictionless evaluation.

---

## 🏅 What We're Most Proud Of

1. **Transforming Predictive Maintenance into Mission-Adaptive Combat Generation:** Most systems stop at simple charts and generic failure predictions. We engineered a tactical flight-line system that goes far beyond: it runs physics-informed counterfactual mission stress simulations (desert heat, sandstorms, 9G turns), dynamically re-assigns degraded platforms to secondary Air Tasking Order (ATO) sorties to prevent lost missions, and auto-dispatches official Air Force AFTO Form 781A discrepancy orders with Red X grounding symbols and NSN parts requisition codes.
2. **Real Aerospace Propulsion Physics (18.21 Cycles RMSE):** We didn't use toy mock data. We preprocessed and engineered 108 condition features from NASA C-MAPSS turbofan engines, running GPU-accelerated XGBoost models on an NVIDIA RTX 3050 to deliver battle-tested predictive precision.
3. **Deep, Load-Bearing IBM Bob FastMCP & watsonx.ai Integration:** Bob is genuinely autonomous. Through FastMCP at `/mcp`, IBM Bob accesses 11 specialized tools to query fleet readiness, simulate theater environmental stress, synthesize Granite 3-8B diagnostic explanations, and generate expeditionary work orders in natural language.
4. **End-to-End Operational Flywheel:** From raw HUMS telemetry anomaly $\rightarrow$ RUL forecast $\rightarrow$ FMC/PMC/NMC airworthiness assessment $\rightarrow$ watsonx.ai diagnostic explanation $\rightarrow$ ATO sortie re-allocation $\rightarrow$ prioritized maintenance turnaround $\rightarrow$ executive commander morning briefing.
