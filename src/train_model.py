"""Train a RandomForest failure-risk model on the HUMS dataset."""

import pathlib
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

DATA_PATH = pathlib.Path(__file__).resolve().parent.parent / "data" / "hums_sensor_data.csv"
MODEL_DIR = pathlib.Path(__file__).resolve().parent.parent / "models"
FEATURES = [
    "vibration_g", "temperature_c", "oil_pressure_psi",
    "usage_hours", "maintenance_events", "days_since_maintenance",
]
TARGET = "failure_within_30d"


def train():
    df = pd.read_csv(DATA_PATH)
    X, y = df[FEATURES], df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    # For complex/imbalanced real-world datasets, we need to balance classes
    # and use GridSearchCV to find optimal hyperparameters
    from sklearn.model_selection import GridSearchCV
    
    param_grid = {
        'n_estimators': [50, 100, 200],
        'max_depth': [None, 5, 10],
        'min_samples_leaf': [1, 5, 10],
        'class_weight': ['balanced', 'balanced_subsample']
    }
    
    rf = RandomForestClassifier(random_state=42)
    grid_search = GridSearchCV(estimator=rf, param_grid=param_grid, cv=5, scoring='f1', n_jobs=-1)
    
    print("Tuning hyperparameters for difficult dataset...")
    grid_search.fit(X_train, y_train)
    
    model = grid_search.best_estimator_
    print(f"Best parameters: {grid_search.best_params_}")

    print("-- Classification Report --")
    print(classification_report(y_test, model.predict(X_test)))

    importances = pd.Series(model.feature_importances_, index=FEATURES)
    print("-- Feature Importances --")
    print(importances.sort_values(ascending=False).to_string())

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    out_path = MODEL_DIR / "failure_model.joblib"
    joblib.dump(model, out_path)
    print(f"\nModel saved -> {out_path}")
    return model


if __name__ == "__main__":
    train()
