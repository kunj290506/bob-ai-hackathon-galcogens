# Solution Overview

## How It Works

The Mission Readiness Copilot follows a four-stage pipeline that transforms raw
sensor telemetry into actionable maintenance decisions.

### Stage 1: Data Ingestion

A synthetic HUMS (Health and Usage Monitoring System) dataset simulates real
sensor feeds from military assets. Each record contains:

- **vibration_g** -- accelerometer reading in g-force units
- **temperature_c** -- operating temperature in Celsius
- **oil_pressure_psi** -- hydraulic oil pressure in PSI
- **usage_hours** -- cumulative operating hours
- **maintenance_events** -- count of past maintenance actions
- **days_since_maintenance** -- days elapsed since the last service

A deterministic failure pattern is injected: assets with simultaneously high
vibration, high temperature, low oil pressure, and long gaps since maintenance
are labelled as likely to fail within 30 days.

### Stage 2: Model Training

A scikit-learn RandomForestClassifier is trained on the labelled dataset. The
model is deliberately simple and explainable:

- 100 decision trees with a maximum depth of 6.
- Balanced class weights to handle the low failure rate.
- Feature importances are extracted and surfaced to end users.

### Stage 3: Readiness Scoring

For each asset, the trained model produces a failure probability. The readiness
score is defined as `1 - failure_probability`. Assets are bucketed into risk
levels (Low / Medium / High) for quick triage.

### Stage 4: Dashboard and Maintenance Plan

A Streamlit dashboard presents three views:

1. **Asset Readiness Scores** -- a sortable table of all assets with their
   readiness scores and risk levels.
2. **Predicted Failure Window** -- a horizontal bar chart showing 30-day failure
   probabilities, color-coded by severity.
3. **Prioritised Maintenance Plan** -- an expandable list of flagged assets with
   the top sensor readings driving their risk, plus a maintenance recommendation.

### IBM Bob's Role

IBM Bob (Antigravity) was used throughout:

- **Plan mode** to design the feature set and pipeline architecture before coding.
- **Agent mode** to generate every source file, iterating on the dashboard layout
  and model parameters.
- The architecture diagram was produced through Bob.
- The explainability layer (feature importances per asset) was designed through
  iterative Bob prompts to ensure the output is understandable by a non-technical
  logistics planner.
