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

It predicts component Remaining Useful Life (RUL) using GPU-accelerated XGBoost models trained on the **NASA C-MAPSS** aerospace turbofan degradation benchmark (achieving an holdout RMSE of **18.21 cycles**). It connects to **IBM watsonx.ai Granite 3-8B** to explain root-cause degradation in natural language and recommends an optimized, prioritized maintenance turnaround plan to guarantee fleet readiness before upcoming mission launch deadlines.

---

## ✨ Key Features & Breakthrough Innovations

- **What-If Mission Stress & Environmental Digital Twin:** Counterfactual simulation engine evaluating operational degradation under harsh operational theaters (Desert Heat 45°C, Sand/Dust particulate ingestion, Sub-Zero Arctic, and 9G combat air maneuvering) to forecast accelerated wear multipliers and mission survivability probability before platform commitment.
- **Mission-Adaptive Sortie Re-allocation Matrix:** Dynamic Air Tasking Order (ATO) matching engine. Instead of binary platform grounding (NMC), the engine dynamically matches degraded airframes (PMC) to secondary low-stress sortie profiles (Combat Air Patrol vs Close Air Support vs High-Altitude Reconnaissance vs Tactical Ferry), preserving combat generation tempo and saving critical sorties.
- **Automated Digital AFTO Form 781A Discrepancy Generator:** Digital compliance with Air Force Technical Order 00-20-1 and DA Form 2404. Automatically dispatches official maintenance discrepancy sheets with Red X grounding / Red Diagonal symbols, automated Job Control Numbers (JCN), military J-codes, and Federal Defense Logistics Agency (DLA) National Stock Number (NSN) parts manifests.
- **GPU-Accelerated RUL Prognostics (18.21 Cycles RMSE):** High-precision Remaining Useful Life regression trained on NASA C-MAPSS turbofan data across 108 engineered condition telemetry features with rolling exponential statistics.
- **Condition-Based FMC / PMC / NMC Readiness Engine:** Evaluates multi-subsystem airworthiness (propulsion, gearboxes, hydraulics, radar) against mission deployment horizons.
- **IBM Bob Copilot Integration via FastMCP:** Official Model Context Protocol (MCP) server at `/mcp` exposing 11 autonomous defense tools for real-time querying, mission stress testing, diagnostic investigations, and work order generation.
- **watsonx.ai Granite 3-8B Natural Language Diagnostics:** Delivers plain-language root cause explanations for thermal creep, vibration anomalies, and failure mechanisms with an intelligent dual-mode fallback.
- **Mission-Aware Maintenance Optimizer:** Ranks and schedules work orders by: $\text{Priority} = f(\text{Mission Criticality}, \text{Predicted RUL}, \text{Technician Availability})$ to eliminate preventable mission aborts.
- **Tactical Command Dashboard (Pure JSX):** Dark-mode command center displaying fleet readiness donut gauges, asset diagnostic cards, interactive mission stress simulator, official AFTO Form 781A viewer, prognostics timeline, and live Copilot chat.

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
