# Mission Readiness and Predictive Maintenance Copilot

**Team Galcogens** -- IBM BoB AI Innovation Hackathon 2026

---

## Problem Statement

**D1 - Mission Readiness and Predictive Maintenance**

Military organisations cannot reliably determine whether aircraft, vehicles, and
equipment are mission-ready. Maintenance runs on fixed calendar schedules instead
of actual condition. Health and Usage Monitoring System (HUMS) sensor data that
could predict failures weeks in advance goes unanalysed.

## Solution

An AI-driven copilot that:

1. Ingests HUMS sensor telemetry (vibration, temperature, oil pressure) and
   service records.
2. Computes a readiness score for every asset using a trained failure-risk model.
3. Predicts which components are likely to fail within a 30-day window.
4. Generates a prioritised maintenance plan, explaining why each asset was
   flagged, so logistics planners can act before a mission is compromised.

## Key Features

- Synthetic but realistic HUMS dataset with injected failure patterns.
- Explainable RandomForest classifier with per-asset feature importance
  breakdowns.
- Interactive Streamlit dashboard with three views: readiness scores, failure
  predictions, and a prioritised maintenance plan.
- Minimal, readable codebase -- every function delegates to pandas, numpy, or
  scikit-learn instead of hand-rolled logic.

## Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Language       | Python 3.11                         |
| Data           | pandas, numpy                       |
| ML             | scikit-learn (RandomForestClassifier)|
| Dashboard      | Streamlit, matplotlib               |
| AI Dev Partner | IBM Bob (Antigravity)               |

## How to Run

```bash
# 1. Clone the repository
git clone https://github.com/kunjcr2/bob-ai-hackathon-Galcogens.git
cd bob-ai-hackathon-Galcogens

# 2. Create a virtual environment and install dependencies
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS / Linux
pip install -r src/requirements.txt

# 3. Generate the synthetic dataset
python src/generate_data.py

# 4. Train the failure-prediction model
python src/train_model.py

# 5. Launch the dashboard
streamlit run src/app.py
```

See [docs/setup-guide.md](docs/setup-guide.md) for detailed instructions.

## Demo

- **Video**: see [demo/demo-video-link.txt](demo/demo-video-link.txt)
- **Screenshots**: see [demo/screenshots/](demo/screenshots/)
- **Live URL**: NOT DEPLOYED

## IBM Bob Integration

IBM Bob was not just mentioned -- it was the primary development partner for this
project:

- **Agent mode** scaffolded the entire data pipeline, model training script, and
  Streamlit dashboard.
- **Plan mode** designed the feature engineering strategy and architecture before
  any code was written.
- The architecture diagram in [docs/architecture.md](docs/architecture.md) was
  generated through Bob.
- The per-asset explainability layer (feature importances surfaced in the
  maintenance plan) was designed through iterative Bob prompts.
- Every source file was written, reviewed, and refined inside the Bob IDE.

## Known Limitations

- The dataset is synthetic; real HUMS data would require domain-specific
  calibration of thresholds and sensor ranges.
- The model is a single RandomForest classifier; a production system would
  benefit from time-series models and ensemble approaches.
- No authentication or role-based access control on the dashboard.
- Not deployed to a live URL for this submission round.

## Strongest Work

The tightest part of this submission is the end-to-end pipeline from raw sensor
data to an actionable, explained maintenance plan -- delivered in under 300
total lines of Python. Every prediction comes with a human-readable explanation
of which sensor readings drove the risk score, making the system trustworthy
for a logistics planner who needs to justify maintenance decisions.

---

## Repository Structure

```
submission.yaml          Structured metadata for evaluators
README.md                This file
CONTRIBUTING.md          Contribution guidelines (template)
src/
  generate_data.py       Synthetic HUMS dataset generator
  train_model.py         Model training and evaluation
  app.py                 Streamlit dashboard
  requirements.txt       Python dependencies
  .env.example           Environment variable template
data/
  hums_sensor_data.csv   Generated sensor dataset
models/
  failure_model.joblib   Trained model artifact
docs/
  problem-statement.md   Problem context and audience
  solution-overview.md   Conceptual solution walkthrough
  architecture.md        Architecture diagram and explanation
  setup-guide.md         Step-by-step setup instructions
demo/
  demo-video-link.txt    Demo video URL
  live-demo-url.txt      Deployment URL or NOT DEPLOYED
  screenshots/           Dashboard screenshots
presentation/
  slides-placeholder.txt Placeholder for slides.pdf or slides.pptx
.github/workflows/
  validate.yml           Automated validator (do not modify)
```
