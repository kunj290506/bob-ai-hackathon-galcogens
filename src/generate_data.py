"""Generate a synthetic HUMS-style sensor dataset with injected failure patterns."""

import pathlib
import numpy as np
import pandas as pd

SEED = 42
N_ASSETS = 25
READINGS_PER_ASSET = 40  # multiple readings over time per asset
OUT_DIR = pathlib.Path(__file__).resolve().parent.parent / "data"


def generate():
    rng = np.random.default_rng(SEED)
    rows = []

    for asset_id in range(1, N_ASSETS + 1):
        # Base characteristics per asset
        base_hours = rng.integers(500, 5000)
        days_since_maint = rng.integers(5, 365)
        maint_events = rng.integers(0, 15)

        for _ in range(READINGS_PER_ASSET):
            # Base features with complex noise and correlation
            hours = base_hours + rng.integers(0, 500)
            dsm = days_since_maint + rng.integers(0, 60)
            
            # Non-linear degradation: sensors get worse exponentially with usage and lack of maintenance
            wear_factor = (hours / 5000.0) ** 2 + (dsm / 365.0) ** 1.5
            
            vibration = rng.normal(loc=2.0 + wear_factor, scale=0.5 + 0.2 * wear_factor)
            temperature = rng.normal(loc=75 + 15 * np.sin(wear_factor * np.pi/2), scale=5 + 5 * wear_factor)
            oil_pressure = rng.normal(loc=55 - 10 * np.log1p(wear_factor), scale=4 + 2 * wear_factor)
            
            # Add sudden random spikes (noise) independent of wear
            if rng.random() < 0.05:
                vibration += rng.uniform(1.0, 3.0)
            if rng.random() < 0.05:
                temperature += rng.uniform(10, 25)

            # Complex interaction for failure risk
            # Failure is likely when multiple sensors show non-linear stress
            risk_score = (
                (max(0, vibration - 3.0) ** 2) / 4.0 + 
                (max(0, temperature - 90) ** 1.5) / 20.0 + 
                (max(0, 40 - oil_pressure) ** 2) / 30.0 +
                (dsm / 180.0)
            )
            
            # Non-deterministic failure based on sigmoid-like probability
            prob = 1 / (1 + np.exp(- (risk_score - 4.5)))
            failure = int(rng.random() < prob)

            rows.append({
                "asset_id": f"ASSET-{asset_id:03d}",
                "vibration_g": round(vibration, 3),
                "temperature_c": round(temperature, 1),
                "oil_pressure_psi": round(oil_pressure, 1),
                "usage_hours": int(hours),
                "maintenance_events": int(maint_events),
                "days_since_maintenance": int(dsm),
                "failure_within_30d": failure,
            })

    df = pd.DataFrame(rows)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / "hums_sensor_data.csv"
    df.to_csv(out_path, index=False)
    print(f"Generated {len(df)} rows -> {out_path}")
    print(f"Failure rate: {df['failure_within_30d'].mean():.1%}")
    return df


if __name__ == "__main__":
    generate()
