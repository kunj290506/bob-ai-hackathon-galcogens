# Architecture — D1 Mission Readiness & Predictive Maintenance Copilot

## 1. Modular Monolithic System Architecture

The D1 platform is engineered as a **modular monolith**, packaging the API gateway, ML prognostics engine, condition-based readiness scorer, FastMCP server, and database persistence layer into a unified, high-performance service.

```mermaid
graph TD
    subgraph "Clients & Operators"
        Commander["Wing Commander<br/>(CAC Authenticated)"] -->|HTTPS / REST| UI["React 18 Command Center<br/>(9 Feature Views, Pure JSX)"]
        Tech["Flight-Line Technician<br/>(Inspection Drawer)"] -->|HTTPS / REST| UI
        BobClient["IBM Bob Copilot Agent<br/>(IDE / CLI / Sidecar)"] -->|Streamable HTTP / JSON-RPC 2.0| MCP["FastMCP Server (/mcp)<br/>11 Autonomous Defense Tools"]
    end

    subgraph "Monolithic Core Service (FastAPI)"
        Gateway["FastAPI Application Gateway (/api/v1)"]
        Auth["JWT Authentication & 5-Role RBAC<br/>(Commander, Maint, Logistics, Tech, Admin)"]
        
        subgraph "Domain Logic Engines"
            ReadinessEngine["Readiness Engine<br/>MIL-STD FMC / PMC / NMC Scorer"]
            Predictor["Fleet Predictor Singleton<br/>108-Feature Pipeline & Inference"]
            Planner["Maintenance Optimizer<br/>Dynamic Work Order Prioritization"]
            SimEngine["What-If Stress Twin<br/>Environmental Physics & 9G Maneuvering"]
            ATOMatrix["ATO Sortie Matching Engine<br/>Dynamic Sortie Profile Re-allocation"]
            MilForms["AFTO Form 781A Generator<br/>Red X Symbols & NSN Parts Manifest"]
        end

        subgraph "AI & ML Subsystems"
            XGB["XGBoost GPU RUL Model<br/>CUDA / CPU Fallback (RMSE 18.21)"]
            IForest["Isolation Forest & Z-Score<br/>Thermal & Vibration Anomaly Detector"]
            WX["IBM watsonx.ai Service<br/>Granite 3-8B Instruct (Dual-Mode)"]
        end
    end

    subgraph "Data Storage Layer"
        DB[("SQLAlchemy 2.0 Async<br/>SQLite / PostgreSQL")]
        Weights[("Model Binaries & Scalers<br/>xgb_rul_model.json")]
    end

    UI -->|REST API| Gateway
    Gateway --> Auth
    Auth --> ReadinessEngine
    Auth --> Predictor
    Auth --> Planner
    Auth --> SimEngine
    Auth --> ATOMatrix
    Auth --> MilForms

    MCP --> ReadinessEngine
    MCP --> Predictor
    MCP --> Planner
    MCP --> SimEngine
    MCP --> ATOMatrix
    MCP --> MilForms
    MCP --> WX

    Predictor --> XGB
    Predictor --> IForest
    XGB --> Weights
    IForest --> Weights

    ReadinessEngine --> DB
    Planner --> DB
    SimEngine --> DB
    ATOMatrix --> DB
    MilForms --> DB
```

---

## 2. Component Directory & Responsibility Matrix

| Component | Technology Stack | Core Operational Responsibility |
|---|---|---|
| **Frontend Command Center** | React 18, Vite, Tailwind CSS (Pure JSX) | High-contrast tactical dark-mode operations center; delivers 9 primary feature views, slide-out diagnostic drawers, live Copilot chat, and CAC authentication. |
| **API Application Gateway** | FastAPI, Uvicorn, Pydantic v2 | High-throughput async REST endpoints (`/api/v1/fleet`, `/predictions`, `/maintenance`, `/copilot`, `/simulation`, `/milforms`, `/auth`). |
| **IBM Bob FastMCP Server** | FastMCP (Python), Model Context Protocol | Exposes 11 autonomous tools, live resource streams, and prompt templates over streamable HTTP at `/mcp`. |
| **Prognostics ML Engine** | XGBoost (CUDA GPU), Scikit-Learn, Joblib | Processes 108 engineered condition features from NASA C-MAPSS telemetry; outputs Remaining Useful Life (RUL) with 95% confidence intervals. |
| **Anomaly Detection Engine** | Isolation Forest, Statistical Z-Scores | Unsupervised detector monitoring turbine gas thermal creep ($T_{30}, T_{50}$) and vibration harmonic shifts. |
| **Readiness Scoring Engine** | Python (Domain Logic) | Computes multi-subsystem airworthiness (0–100%) and enforces MIL-STD classification (FMC $\ge 85\%$, PMC $50\%\text{--}84\%$, NMC $< 50\%$). |
| **What-If Mission Stress Simulator** | Python (Physics Modeling) | Counterfactual simulation modeling accelerated wear multipliers ($K_{\text{env}}$) and sortie survivability across desert, sand, arctic, and 9G combat environments. |
| **Sortie Matching Engine (ATO)** | Python (Optimization Logic) | Matches degraded airframes (PMC) against secondary Air Tasking Order (ATO) sortie profiles to eliminate unnecessary binary grounding. |
| **Military Forms Dispatcher** | Python (MIL-STD Compliance) | Generates digital AFTO Form 781A discrepancy records with Red X / Red Diagonal symbols, automated Job Control Numbers (JCN), and DLA NSN parts manifests. |
| **Maintenance Optimizer** | Python (Priority Algorithm) | Ranks work orders by: $\text{Priority} = f(\text{Mission Criticality}, \text{Predicted RUL}, \text{Technician Labor Availability})$. |
| **NLP Diagnostic Intelligence** | IBM watsonx.ai (Granite 3-8B Instruct) | Generates plain-language diagnostic briefings and root-cause explanations with a deterministic offline fallback. |
| **Persistence Database** | SQLAlchemy 2.0 Async, aiosqlite / asyncpg | Relational storage for platforms, subsystems, sensor streams, ML forecasts, work orders, missions, and audit trails. |

---

## 3. Database Entity-Relationship Model (ERD)

```mermaid
erDiagram
    ASSET ||--o{ COMPONENT : contains
    ASSET ||--o{ WORK_ORDER : has
    ASSET ||--o{ MAINTENANCE_RECORD : logs
    COMPONENT ||--o{ SENSOR_READING : produces
    COMPONENT ||--o{ PREDICTION : receives
    MISSION_WINDOW ||--o{ WORK_ORDER : prioritizes
    USER ||--o{ AUDIT_LOG : generates

    ASSET {
        int id PK
        string asset_code UK "e.g. F16-VIPER-101"
        string name
        string asset_type "FIGHTER, HELICOPTER, TANK"
        string model "F-16C Block 52"
        string squadron "388th Fighter Wing"
        string base_location "Hill AFB, UT"
        string status "FMC, PMC, NMC"
        float total_flight_hours
        int total_cycles
    }

    COMPONENT {
        int id PK
        int asset_id FK
        string name "F110-GE-129 Turbofan Engine"
        string component_type "PROPULSION, GEARBOX, HYDRAULICS"
        string serial_number UK
        float current_rul "Estimated RUL cycles"
        string risk_level "LOW, MEDIUM, HIGH, CRITICAL"
        string status "OPERATIONAL, DEGRADED, FAILED"
    }

    SENSOR_READING {
        int id PK
        int component_id FK
        string sensor_type "T30, T50, P30, Fan_RPM, Vibration"
        float value
        string unit "deg_C, psia, rpm, mm_s"
        float anomaly_score
        boolean is_anomalous
        datetime timestamp
    }

    PREDICTION {
        int id PK
        int component_id FK
        float predicted_rul
        float confidence_lower
        float confidence_upper
        string risk_level
        float anomaly_score
        boolean fails_before_mission
        string explanation
        string model_version
    }

    WORK_ORDER {
        int id PK
        int asset_id FK
        string title
        string description
        string priority "CRITICAL, HIGH, MEDIUM, LOW"
        float estimated_hours
        string status "PENDING, APPROVED, IN_PROGRESS, COMPLETED"
        string assigned_to "Technician Name"
    }

    MISSION_WINDOW {
        int id PK
        string title "Operation Iron Shield"
        string required_asset_type "FIGHTER"
        int required_assets_count
        string priority "HIGH, CRITICAL"
        datetime start_time
        datetime end_time
    }

    USER {
        int id PK
        string username UK
        string full_name
        string role "Commander, Maintenance, Logistics, Tech, Admin"
        string clearance_level "SECRET, TOP_SECRET"
    }

    AUDIT_LOG {
        int id PK
        int user_id FK
        string action "APPROVE_WORK_ORDER, RUN_SIMULATION"
        string details
        string ip_address
        datetime timestamp
    }
```

---

## 4. End-to-End FastMCP & Copilot Interaction Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Commander as Flight Commander
    participant Bob as IBM Bob Copilot
    participant MCP as FastMCP Server (/mcp)
    participant Core as Core Readiness & ML Engine
    participant DB as SQLite / PostgreSQL
    participant WX as watsonx.ai Granite 3-8B

    Commander->>Bob: "Why is F16-VIPER-101 grounded and what is needed to ready it?"
    Bob->>MCP: Call explain_readiness_issue(asset_code="F16-VIPER-101")
    MCP->>DB: Query Asset & Component Health (F16-VIPER-101)
    DB-->>MCP: Turbofan RUL=22 cycles, T30=648°C (Threshold 620°C)
    MCP->>Core: Compute Subsystem Readiness Score (42% - NMC)
    Core-->>MCP: Critical airworthiness violation: RUL < 48-hr mission window
    MCP->>WX: Prompt Granite 3-8B with diagnostic telemetry
    WX-->>MCP: Natural-language diagnostic reasoning & maintenance recommendation
    MCP-->>Bob: Return synthesized tactical discrepancy report
    Bob-->>Commander: "F16-VIPER-101 is grounded (NMC) due to High-Pressure Compressor blade erosion..."
    Commander->>Bob: "Generate digital AFTO Form 781A work order"
    Bob->>MCP: Call generate_mil_std_work_order(asset_code="F16-VIPER-101")
    MCP->>DB: Insert Work Order & generate Job Control Number (JCN)
    MCP-->>Bob: Dispatched AFTO 781A with Red X symbol and NSN parts requisition
    Bob-->>Commander: "Dispatched digital AFTO Form 781A (JCN: 26-258-0042) with Red X symbol."
```

---

## 5. Security & Access Control Architecture

The platform implements multi-layer defense-grade security:
1. **Role-Based Access Control (RBAC):** Five distinct operational roles:
   - **Fleet Commander:** Complete fleet visibility, mission approval, executive briefings.
   - **Maintenance Officer:** Work order generation, technician queue management, flight-line authorization.
   - **Logistics Planner:** Supply chain manifests, parts inventory tracking, DLA NSN requisitioning.
   - **Field Technician:** Discrepancy inspection, step-by-step repair execution, sign-off logs.
   - **System Administrator:** System health, audit logging, model retraining triggers.
2. **Cryptographic JWT Tokens:** Signed tokens with configurable expiration (HS256) enforcing permissions on all protected routes.
3. **Password Security:** Salted 12-round bcrypt hashing via `passlib`.
4. **Append-Only Audit Trail:** Every sensitive state mutation (work order approval, mission reallocation, stress simulation) is logged with user ID, IP address, and timestamp.
5. **Air-Gapped Operation:** Dual-mode watsonx.ai service ensures that telemetry data is never leaked outside secure perimeters when running in offline or classified environments.

---

## 6. Scalability & Performance Benchmarks

- **Asynchronous Concurrency:** Built on ASGI (Uvicorn) with async database drivers (`aiosqlite` and `asyncpg`), sustaining 5,000+ concurrent telemetry ingestion requests.
- **GPU-Accelerated Inference:** XGBoost uses CUDA histogram tree building (`tree_method="hist", device="cuda"`), evaluating RUL across 100 aircraft engines in under 15 milliseconds.
- **Database Partitioning:** Designed for time-series range partitioning across `sensor_readings` by monthly intervals to handle millions of historical flight records.

