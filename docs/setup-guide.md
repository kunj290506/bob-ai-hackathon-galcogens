# Setup Guide

Step-by-step instructions to run the Mission Readiness Copilot from scratch.

## Prerequisites

- Python 3.11 or later
- pip (comes with Python)
- Git

## 1. Clone the Repository

```bash
git clone https://github.com/kunjcr2/bob-ai-hackathon-Galcogens.git
cd bob-ai-hackathon-Galcogens
```

## 2. Create a Virtual Environment

```bash
python -m venv .venv
```

Activate it:

- **Windows**: `.venv\Scripts\activate`
- **macOS / Linux**: `source .venv/bin/activate`

## 3. Install Dependencies

```bash
pip install -r src/requirements.txt
```

## 4. Generate the Synthetic Dataset

```bash
python src/generate_data.py
```

This creates `data/hums_sensor_data.csv` with 1000 sensor readings across 25
assets.

## 5. Train the Model

```bash
python src/train_model.py
```

This trains a RandomForest classifier and saves it to
`models/failure_model.joblib`. A classification report and feature importances
are printed to the console.

## 6. Launch the Dashboard

```bash
streamlit run src/app.py
```

The dashboard opens in your browser at `http://localhost:8501`. It has three
tabs:

1. **Asset Readiness Scores** -- sortable table with risk levels.
2. **Predicted Failure Window** -- bar chart of 30-day failure probabilities.
3. **Prioritized Maintenance Plan** -- flagged assets with explanations.

## Environment Variables

No environment variables are required for the base demo. If you need to
configure any in the future, copy `src/.env.example` to `src/.env` and fill
in the values. Never commit the `.env` file.

## Troubleshooting

| Issue                          | Fix                                          |
|--------------------------------|----------------------------------------------|
| `ModuleNotFoundError`          | Ensure the virtual environment is activated  |
| `FileNotFoundError` on CSV     | Run `python src/generate_data.py` first      |
| `FileNotFoundError` on model   | Run `python src/train_model.py` first        |
| Streamlit does not open        | Check that port 8501 is not in use           |
