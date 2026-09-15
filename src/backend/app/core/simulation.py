"""
Counterfactual Mission Stress & Environmental Degradation Simulator.
Simulates environmental extremes (ambient temperature, sand/dust particulate ingestion,
high-G air combat maneuvering, supersonic throttle excursions) to forecast accelerated
component degradation before committing assets to harsh operational theaters.
"""

from typing import Dict, Any, List, Optional
import numpy as np

from src.backend.app.ml.predictor import FleetPredictor

# Stress multipliers based on aerospace propulsion environmental testing
ENVIRONMENT_SEVERITY_FACTORS = {
    "STANDARD_DAY": {"temp_bias": 0.0, "wear_multiplier": 1.0, "desc": "Standard ISO atmosphere (15°C, sea level)"},
    "DESERT_HEAT": {"temp_bias": 35.0, "wear_multiplier": 1.45, "desc": "High ambient heat (45°C) reducing turbine thermal margin"},
    "SAND_DUST_INGESTION": {"temp_bias": 15.0, "wear_multiplier": 1.80, "desc": "High particulate ingestion causing blade erosion and cooling duct clogging"},
    "COMBAT_HIGH_G": {"temp_bias": 25.0, "wear_multiplier": 1.60, "desc": "Sustained afterburner and high-G turns inducing severe mechanical stress"},
    "ARCTIC_COLD": {"temp_bias": -30.0, "wear_multiplier": 1.15, "desc": "Sub-zero cold soak (-20°C) with high hydraulic fluid viscosity"}
}


DEFAULT_NOMINAL_TELEMETRY = {
    "s_2": 642.4, "s_3": 1586.9, "s_4": 1402.8, "s_7": 553.9, "s_8": 2388.1,
    "s_9": 9056.1, "s_11": 47.4, "s_12": 521.8, "s_13": 2388.0, "s_14": 8130.0,
    "s_15": 8.41, "s_17": 393.0, "s_20": 38.9, "s_21": 23.3
}


def simulate_mission_stress(
    nominal_telemetry: Optional[Dict[str, float]] = None,
    mission_profile: str = "DESERT_HEAT",
    mission_duration_hours: float = 6.0,
    sortie_g_rating: float = 7.0
) -> Dict[str, Any]:
    """
    Simulates operational degradation under harsh theater conditions:
    - Injects thermodynamic temperature rise into HPC (T30) and LPT (T50)
    - Re-evaluates RUL using GPU-accelerated XGBoost
    - Calculates accelerated wear factor and mission survivability probability

    NOTE: Explicitly designated as a WHAT-IF / COUNTERFACTUAL SIMULATION model,
    not a certified physical digital twin.
    """
    profile = ENVIRONMENT_SEVERITY_FACTORS.get(mission_profile.upper(), ENVIRONMENT_SEVERITY_FACTORS["DESERT_HEAT"])
    wear_mult = profile["wear_multiplier"]
    temp_bias = profile["temp_bias"]

    # If high G maneuvers, additional mechanical stress multiplier
    if sortie_g_rating > 5.0:
        g_stress = 1.0 + (sortie_g_rating - 5.0) * 0.08
        wear_mult *= g_stress

    # Merge nominal baseline telemetry
    base_snapshot = dict(DEFAULT_NOMINAL_TELEMETRY)
    if nominal_telemetry:
        base_snapshot.update(nominal_telemetry)

    # Apply thermodynamic shifts to baseline telemetry
    stressed_telemetry = dict(base_snapshot)
    stressed_telemetry["s_3"] = stressed_telemetry.get("s_3", 1586.9) + temp_bias * 0.6  # HPC Temp
    stressed_telemetry["s_4"] = stressed_telemetry.get("s_4", 1402.8) + temp_bias * 0.8  # LPT EGT Temp
    stressed_telemetry["s_15"] = stressed_telemetry.get("s_15", 8.41) + 0.03 * (wear_mult - 1.0) # Bypass ratio drift

    # Run inference with FleetPredictor
    predictor = FleetPredictor.get_instance()
    simulated_history = [base_snapshot, stressed_telemetry]
    inference_result = predictor.predict_component_health(simulated_history, mission_window_hours=mission_duration_hours)

    base_rul = inference_result["predicted_rul"]
    # Apply mission operational stress degradation
    effective_mission_rul = max(1.0, round(base_rul / wear_mult, 1))

    # Survivability probability
    survivability_prob = max(5.0, min(99.0, round(100.0 * (1.0 - (mission_duration_hours / (effective_mission_rul + 1e-3)) ** 2), 1)))
    if effective_mission_rul < mission_duration_hours:
        survivability_prob = min(35.0, survivability_prob)

    is_mission_survivable = survivability_prob >= 80.0 and effective_mission_rul >= mission_duration_hours

    recommendation = (
        f"APPROVED FOR SORTIE: Projected mission survivability is {survivability_prob}%. Subsystems have sufficient thermal headroom."
        if is_mission_survivable else
        f"ABORT RECOMMENDED: Mission survivability dropped to {survivability_prob}%. Theater stress ({profile['desc']}) accelerates wear by {wear_mult:.2f}x, exhausting remaining RUL in {effective_mission_rul} hrs."
    )

    return {
        "model_type": "COUNTERFACTUAL_WHAT_IF_SIMULATION",
        "is_validated_physical_twin": False,
        "disclaimer": "This is a counterfactual what-if simulation model for tactical stress forecasting, not an empirically certified hardware twin.",
        "mission_profile": mission_profile,
        "profile_description": profile["desc"],
        "planned_sortie_duration_hours": mission_duration_hours,
        "sortie_g_rating": sortie_g_rating,
        "wear_acceleration_multiplier": round(wear_mult, 2),
        "nominal_predicted_rul": base_rul,
        "effective_theater_rul": effective_mission_rul,
        "mission_survivability_probability": survivability_prob,
        "is_mission_survivable": is_mission_survivable,
        "projected_egt_spike_deg_r": round(temp_bias * 0.8, 1),
        "tactical_recommendation": recommendation
    }
