# D1 Mission Readiness Copilot — Source Code Architecture

Welcome to the source code repository of the **D1 Mission Readiness & Predictive Maintenance Copilot**. This directory encapsulates the entire modular monolithic application, including the high-performance FastAPI backend, ML prognostics models, FastMCP server for IBM Bob, React 18 command center frontend, and database seeding pipelines.

---

## Directory Overview

```
src/
├── backend/                   # Modular monolithic backend service
│   ├── app/
│   │   ├── api/               # REST API endpoints & route controllers
│   │   │   ├── routes/
│   │   │   │   ├── auth.py          # JWT authentication & 5-role RBAC
│   │   │   │   ├── fleet.py         # Fleet readiness, platforms, & ATO missions
│   │   │   │   ├── predictions.py   # RUL predictions, anomaly timeline, & ML trigger
│   │   │   │   ├── maintenance.py   # Work orders, scheduling, & CBM+ plan generation
│   │   │   │   ├── copilot.py       # IBM Bob context builder & conversational chat
│   │   │   │   ├── simulation.py    # Mission stress & theater environmental twin
│   │   │   │   ├── milforms.py      # AFTO Form 781A & DA 2404 discrepancy generator
│   │   │   │   └── audit.py         # Security audit logging & inspection trail
│   │   │   └── deps.py              # Dependency injection (Auth, DB session, Permissions)
│   │   ├── core/              # Core business & operational domain logic
│   │   │   ├── config.py            # Pydantic v2 application settings & environment
│   │   │   ├── security.py          # Password hashing (bcrypt) & JWT token handling
│   │   │   ├── readiness.py         # FMC / PMC / NMC scoring engine (MIL-STD airworthiness)
│   │   │   ├── planner.py           # Mission-aware maintenance prioritization algorithm
│   │   │   ├── simulation.py        # Environmental stress twin (Thermal creep, Sand, 9G turns)
│   │   │   └── mission_matching.py  # Dynamic Air Tasking Order (ATO) sortie reallocation matrix
│   │   ├── db/                # Database persistence layer
│   │   │   ├── base.py              # SQLAlchemy 2.0 async engine & sessionmaker
│   │   │   └── models.py            # Declarative ORM models (Assets, Components, Telemetry, etc.)
│   │   ├── ml/                # Predictive maintenance & machine learning subsystem
│   │   │   ├── predictor.py         # FleetPredictor singleton (Feature loader & inference)
│   │   │   ├── rul_model.py         # XGBoost CUDA/CPU model wrapper with confidence bounds
│   │   │   ├── anomaly_detector.py  # Isolation Forest & statistical Z-score detector
│   │   │   ├── feature_engineering.py # 108 rolling window & exponential smoothing features
│   │   │   ├── train_rul.py         # GPU training pipeline on NASA C-MAPSS FD001
│   │   │   └── weights/             # Serialized model binaries (xgb_rul_model.json, scalers)
│   │   ├── mcp/               # FastMCP Server for IBM Bob integration
│   │   │   ├── server.py            # 11 MCP operational defense tools at /mcp
│   │   │   └── schemas.py           # Pydantic parameter schemas for MCP tool calls
│   │   ├── schemas/           # Pydantic validation schemas for API requests & responses
│   │   │   ├── auth.py
│   │   │   ├── fleet.py
│   │   │   ├── maintenance.py
│   │   │   └── simulation.py
│   │   ├── services/          # External intelligence & integration services
│   │   │   ├── watsonx_service.py   # IBM watsonx.ai Granite 3-8B dual-mode engine
│   │   │   └── audit_service.py     # Append-only security audit dispatcher
│   │   └── main.py            # FastAPI application factory, middleware, & lifecycle hooks
│   ├── tests/                 # Backend automated test suite (Pytest, HTTPX Async)
│   ├── requirements.txt       # Production Python dependencies
│   └── Dockerfile             # Container definition for backend service
│
├── frontend/                  # React 18 tactical command center (Pure JSX)
│   ├── src/
│   │   ├── components/        # Reusable tactical UI components
│   │   │   ├── dashboard/           # 9 Primary command center feature views
│   │   │   │   ├── DashboardOverview.jsx      # Top readiness KPI strip & fleet triage
│   │   │   │   ├── FleetView.jsx              # Platform grid, filters, & asset inspection
│   │   │   │   ├── ReadinessEngineView.jsx    # Subsystem MIL-STD readiness score matrix
│   │   │   │   ├── RULPrognosticsView.jsx     # NASA C-MAPSS RUL degradation timeline
│   │   │   │   ├── MaintenanceOptimizerView.jsx # CBM+ dispatch work order queues & actions
│   │   │   │   ├── MissionsView.jsx           # Air Tasking Order (ATO) sortie deployment tracker
│   │   │   │   ├── StressSimulatorView.jsx    # Environmental twin & high-G combat simulator
│   │   │   │   ├── MilFormsView.jsx           # Official AFTO Form 781A & ATO reallocation matrix
│   │   │   │   ├── GraniteDiagnosticsView.jsx # watsonx Granite 3-8B diagnostic briefings
│   │   │   │   ├── AssetDetailPanel.jsx       # Slide-out platform diagnostic drawer
│   │   │   │   └── Shared.jsx                 # Shared tactical badge, button, & card primitives
│   │   │   ├── CopilotChatDrawer.jsx          # Real-time IBM Bob FastMCP chat drawer
│   │   │   ├── Navbar.jsx                     # Top operational bar & quick actions
│   │   │   └── ...                            # Additional tactical view primitives
│   │   ├── context/           # React context providers
│   │   │   ├── AuthContext.jsx                # CAC / DoD ID authentication & 5-role RBAC state
│   │   │   └── ThemeContext.jsx               # Dark-mode tactical command theme
│   │   ├── pages/             # Root application views
│   │   │   ├── LandingPage.jsx                # Public mission overview & CBM+ architecture showcase
│   │   │   ├── LoginPage.jsx                  # Defense authenticated login with pre-loaded credentials
│   │   │   └── DashboardPage.jsx              # Authenticated command center managing tabs & Copilot
│   │   ├── App.jsx            # Application router & provider wrapper
│   │   ├── main.jsx           # React DOM client entry point
│   │   └── index.css          # Military dark-mode design system & Tailwind base styling
│   ├── package.json           # Node.js dependencies & scripts
│   ├── vite.config.js         # Vite build configuration & API proxy setup
│   └── Dockerfile             # Container definition for frontend service
│
├── data/                      # Data synthesis, seed pipelines, & baselines
│   ├── seed.py                # Database population script (20 platforms, 100 components, telemetry)
│   ├── c_mapss_loader.py      # NASA C-MAPSS FD001 dataset parser & preprocessor
│   └── telemetry_generator.py # Realistic HUMS multi-channel sensor stream synthesizer
│
└── .env.example               # Complete environment variable blueprint
```

---

## Key Subsystems & Design Architecture

### 1. Backend Modular Monolith (`src/backend/app/`)
The backend is structured as a high-throughput async Python 3.11 service utilizing **FastAPI** and **SQLAlchemy 2.0 Async**.
- **`core/readiness.py`**: Computes deterministic readiness scores (0–100%) and evaluates platform classification against military airworthiness criteria:
  - **FMC (Fully Mission Capable):** Readiness >= 85%, zero critical subsystem failures.
  - **PMC (Partially Mission Capable):** Readiness 50%–84%, non-critical secondary degradations.
  - **NMC (Non-Mission Capable):** Readiness < 50% or any airworthiness-critical component RUL <= mission window.
- **`core/simulation.py`**: Ingests counterfactual environmental theater parameters (ambient temperatures up to 45°C, particulate sand ingestion rates, and sustained 9G combat air maneuvering) to calculate accelerated wear multipliers ($K_{env} \in [1.2, 3.8]$) and mission survivability probability.
- **`core/mission_matching.py`**: Air Tasking Order (ATO) matching engine that re-allocates degraded platforms (PMC) to viable low-stress sorties (e.g. Reconnaissance ISR or Tactical Ferry) rather than grounding them, preserving operational combat generation tempo.
- **`core/milforms.py`**: Generates digital AFTO Form 781A discrepancy records with Red X / Red Diagonal symbols, automated Job Control Numbers (JCN), military J-codes, and Defense Logistics Agency (DLA) National Stock Numbers (NSN).

### 2. Machine Learning & Prognostics (`src/backend/app/ml/`)
- **NASA C-MAPSS FD001 Benchmark**: Trained on 100 turbofan engine run-to-failure trajectories with 21 sensor channels (temperatures, pressures, fan speeds, bypass ratios).
- **108 Engineered Features**: Rolling means, rolling standard deviations, trend deltas across windows of 5 and 10 flight cycles, and exponential moving averages.
- **XGBoost CUDA Regressor**: High-precision RUL prediction achieving a verified holdout RMSE of **18.21 cycles**, MAE of **12.75 cycles**, and $R^2 = 0.7935$.
- **Isolation Forest**: Unsupervised anomaly detection detecting thermal creep and vibration anomalies with normalized anomaly scores.

### 3. IBM Bob FastMCP Server (`src/backend/app/mcp/`)
Exposes an official **Model Context Protocol (MCP)** endpoint at `http://localhost:8000/mcp` with 11 autonomous tools:
1. `get_fleet_readiness_summary()`: FMC/PMC/NMC counts and fleet readiness index.
2. `get_asset_readiness(asset_code)`: Detailed platform diagnostics and component health.
3. `predict_component_failures(filter_high_risk_only)`: RUL forecasts and confidence bounds.
4. `explain_readiness_issue(asset_code)`: watsonx.ai Granite 3-8B natural language explanations.
5. `generate_maintenance_plan(mission_window_hours)`: Turnaround work orders ranked by urgency.
6. `get_sensor_anomalies(asset_code)`: Detected thermal, vibration, and pressure anomalies.
7. `search_maintenance_history(query_keyword)`: Search historical repair actions and part replacements.
8. `get_mission_readiness_forecast()`: Capability assessment against upcoming deployment windows.
9. `simulate_mission_stress(asset_code, mission_profile, sortie_duration_hours, sortie_g_rating)`: Physics-informed environmental stress simulator.
10. `get_mission_reallocation_matrix(asset_code)`: Sortie matching engine for degraded assets.
11. `generate_mil_std_work_order(asset_code)`: Digital AFTO Form 781A discrepancy generator.

### 4. IBM watsonx.ai Granite Intelligence (`src/backend/app/services/watsonx_service.py`)
- Direct integration with `ibm/granite-3-8b-instruct` foundation model via official IBM Cloud IAM authentication and REST generation endpoints.
- **Intelligent Dual-Mode Execution**: Automatically falls back to a deterministic offline Granite military diagnostic simulator when running in keyless demonstration environments, guaranteeing a zero-crash evaluation experience.

### 5. Frontend Tactical Command Center (`src/frontend/`)
- Built strictly with **pure JavaScript / JSX** (React 18 + Vite + Tailwind CSS) with zero TypeScript dependencies.
- **Dark-Mode Aerospace Aesthetic**: Optimized for operational flight-line control rooms with high-contrast tactical palettes (Emerald for FMC, Amber for PMC, Rose for NMC, Gold for Copilot).
- **Responsive Architecture**: Includes a public overview Landing Page, authenticated CAC/DoD ID login simulator, and 9 modular Command Center views with live slide-out Copilot drawer.

---

## Environment Variables Configuration

Copy `src/.env.example` to the repository root as `.env`. The default settings run out-of-the-box using local SQLite and the offline Granite dual-mode engine.

| Variable | Description | Default / Example |
|---|---|---|
| `DATABASE_URL` | SQLAlchemy async connection string | `sqlite+aiosqlite:///./fleet_readiness.db` |
| `SECRET_KEY` | JWT cryptographic signing key | `galcogens-super-secret-key-change-in-prod` |
| `ALGORITHM` | JWT signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime | `480` |
| `WATSONX_API_KEY` | IBM Cloud API key (optional for live mode) | `""` (runs offline Granite if blank) |
| `WATSONX_PROJECT_ID` | IBM watsonx.ai project GUID | `""` |
| `WATSONX_URL` | IBM watsonx.ai regional endpoint | `https://us-south.ml.cloud.ibm.com` |
| `WATSONX_MODEL_ID` | Foundation model ID | `ibm/granite-3-8b-instruct` |
| `VITE_API_URL` | Backend URL for Vite proxy | `http://localhost:8000` |
