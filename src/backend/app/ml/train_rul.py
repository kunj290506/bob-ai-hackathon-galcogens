"""
GPU-Accelerated RUL Model Training Pipeline.
Trains an enterprise-grade XGBoost Regressor on NASA C-MAPSS turbofan data
using NVIDIA CUDA acceleration on local GPU with fallback to multi-threaded CPU.
"""

import json
import logging
import time
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
import joblib
import numpy as np
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import xgboost as xgb

from src.backend.app.ml.cmapss_loader import prepare_training_data, prepare_test_data

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("RULTrainer")


def compute_phm_score(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """
    Computes the PHM08 / NASA competition scoring function:
    Penalizes late predictions (where failure occurs before prediction)
    exponentially harder than early predictions.
    s = sum(exp(-d/13) - 1 for d < 0) + sum(exp(d/10) - 1 for d >= 0) where d = y_pred - y_true
    """
    d = y_pred - y_true
    score = 0.0
    for diff in d:
        if diff < 0:
            score += np.exp(-diff / 13.0) - 1.0
        else:
            score += np.exp(diff / 10.0) - 1.0
    return float(score)


def train_rul_model(
    subset: str = "FD001",
    save_dir: Optional[Path] = None,
    use_gpu: bool = True
) -> Dict[str, Any]:
    """
    Executes the complete training workflow, evaluates on holdout test units,
    and serializes the production model artifacts.
    """
    if save_dir is None:
        save_dir = Path(__file__).resolve().parent / "weights"
    save_dir.mkdir(parents=True, exist_ok=True)

    logger.info(f"Loading NASA C-MAPSS subset '{subset}' and engineering features...")
    X_train, y_train, feature_cols = prepare_training_data(subset=subset)
    X_test, y_test, _ = prepare_test_data(subset=subset)

    logger.info(f"Train samples: {len(X_train)} | Test engines: {len(X_test)} | Feature dimensions: {len(feature_cols)}")

    # Model configuration with GPU acceleration
    tree_method = "hist"
    device = "cuda" if use_gpu else "cpu"

    params = {
        "n_estimators": 250,
        "max_depth": 5,
        "learning_rate": 0.035,
        "subsample": 0.85,
        "colsample_bytree": 0.80,
        "reg_alpha": 0.1,
        "reg_lambda": 1.0,
        "tree_method": tree_method,
        "device": device,
        "random_state": 42,
        "n_jobs": -1
    }

    logger.info(f"Initializing XGBoost with device='{device}' (GPU accelerated)...")
    model = xgb.XGBRegressor(**params)

    start_time = time.time()
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)
    train_duration = time.time() - start_time

    logger.info(f"Model training completed in {train_duration:.2f} seconds.")

    # In-sample metrics
    y_train_pred = model.predict(X_train)
    train_rmse = float(np.sqrt(mean_squared_error(y_train, y_train_pred)))
    train_mae = float(mean_absolute_error(y_train, y_train_pred))
    train_r2 = float(r2_score(y_train, y_train_pred))

    # Out-of-sample holdout test metrics
    y_test_pred = model.predict(X_test)
    test_rmse = float(np.sqrt(mean_squared_error(y_test, y_test_pred)))
    test_mae = float(mean_absolute_error(y_test, y_test_pred))
    test_r2 = float(r2_score(y_test, y_test_pred))
    phm_score = compute_phm_score(y_test.values, y_test_pred)

    logger.info(f"--- TEST SET EVALUATION RESULTS ({subset}) ---")
    logger.info(f"Holdout Test RMSE: {test_rmse:.2f} cycles")
    logger.info(f"Holdout Test MAE:  {test_mae:.2f} cycles")
    logger.info(f"Holdout Test R^2:  {test_r2:.4f}")
    logger.info(f"NASA PHM08 Score:  {phm_score:.2f}")

    # Top feature importances
    importances = model.feature_importances_
    sorted_idx = np.argsort(importances)[::-1][:15]
    top_features = [{"feature": feature_cols[i], "importance": float(importances[i])} for i in sorted_idx]

    logger.info("Top 5 critical telemetry degradation drivers:")
    for f in top_features[:5]:
        logger.info(f"  - {f['feature']}: {f['importance']:.4f}")

    # Serialization
    model_path = save_dir / "rul_xgboost_model.joblib"
    meta_path = save_dir / "feature_columns.json"
    metrics_path = save_dir / "model_metrics.json"

    joblib.dump(model, model_path)
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump({"features": feature_cols, "informative_sensors": list(feature_cols)}, f, indent=2)

    metrics = {
        "dataset": subset,
        "trained_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "training_duration_seconds": round(train_duration, 2),
        "device": device,
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "train_rmse": round(train_rmse, 2),
        "train_mae": round(train_mae, 2),
        "train_r2": round(train_r2, 4),
        "test_rmse": round(test_rmse, 2),
        "test_mae": round(test_mae, 2),
        "test_r2": round(test_r2, 4),
        "phm_score": round(phm_score, 2),
        "top_features": top_features
    }

    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    logger.info(f"Serialized production model weights to {model_path}")
    return metrics


if __name__ == "__main__":
    import sys
    use_gpu = True
    train_rul_model(subset="FD001", use_gpu=use_gpu)
