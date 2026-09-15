"""
Mission-Adaptive Sortie Re-allocation & Air Tasking Order (ATO) Matching Engine.
Instead of binary grounding (NMC), dynamically reallocates partially degraded platforms
to compatible lower-stress mission profiles, preserving squadron combat generation.
"""

from typing import Dict, List, Any

# Defense Air Tasking Order (ATO) profile stress tiers
SORTIE_PROFILES = [
    {
        "code": "CAP_HEAVY",
        "name": "Combat Air Patrol / Air Superiority (High-G / Afterburner)",
        "min_rul_hours": 45.0,
        "allowed_status": ["FMC"],
        "stress_level": "EXTREME",
        "thermal_risk": "HIGH",
        "desc": "Full afterburner climbs, high sustained G-loads (up to 9G), and rapid throttle cycling."
    },
    {
        "code": "CAS_GROUND",
        "name": "Close Air Support / Deep Interdiction (Heavy Ordnance)",
        "min_rul_hours": 35.0,
        "allowed_status": ["FMC", "PMC"],
        "stress_level": "HIGH",
        "thermal_risk": "MODERATE",
        "desc": "Heavy payload wing carriage, low-altitude dust exposure, and evasive maneuvering."
    },
    {
        "code": "RECON_ISR",
        "name": "High-Altitude Reconnaissance & Electronic Warfare",
        "min_rul_hours": 25.0,
        "allowed_status": ["FMC", "PMC"],
        "stress_level": "MODERATE",
        "thermal_risk": "LOW",
        "desc": "Steady high-altitude cruising, moderate throttle excursions, low airframe strain."
    },
    {
        "code": "FERRY_TRANSIT",
        "name": "Tactical Ferry / Non-Combat Strategic Transit",
        "min_rul_hours": 15.0,
        "allowed_status": ["FMC", "PMC"],
        "stress_level": "LOW",
        "thermal_risk": "MINIMAL",
        "desc": "Straight-and-level economic transit to depot or intermediate staging base."
    }
]


def match_asset_to_sortie_profiles(asset_data: Dict[str, Any], lowest_component_rul: float) -> Dict[str, Any]:
    """
    Evaluates which Air Tasking Order (ATO) sortie profiles an asset can safely execute.
    """
    asset_status = asset_data.get("status", "FMC")
    matched_sorties = []
    restricted_sorties = []

    for profile in SORTIE_PROFILES:
        is_rul_sufficient = lowest_component_rul >= profile["min_rul_hours"]
        is_status_permitted = asset_status in profile["allowed_status"]

        if is_rul_sufficient and is_status_permitted:
            matched_sorties.append({
                "profile_code": profile["code"],
                "profile_name": profile["name"],
                "stress_level": profile["stress_level"],
                "compatibility": "CLEARED FOR MISSION",
                "margin_hours": round(lowest_component_rul - profile["min_rul_hours"], 1)
            })
        else:
            reason = []
            if not is_rul_sufficient:
                reason.append(f"RUL ({lowest_component_rul} hrs) below required threshold ({profile['min_rul_hours']} hrs)")
            if not is_status_permitted:
                reason.append(f"Current status {asset_status} prohibited for {profile['code']}")

            restricted_sorties.append({
                "profile_code": profile["code"],
                "profile_name": profile["name"],
                "stress_level": profile["stress_level"],
                "compatibility": "RESTRICTED",
                "reason": " • ".join(reason)
            })

    # Recommended operational disposition
    if matched_sorties:
        best_cleared = matched_sorties[0]
        tactical_disposition = f"CLEARED: Asset qualified for {best_cleared['profile_name']}. Reallocation preserves operational tempo."
    else:
        tactical_disposition = "GROUNDED: No combat or transit sortie profiles permitted. Priority maintenance required."

    return {
        "asset_code": asset_data.get("asset_code"),
        "asset_name": asset_data.get("name"),
        "current_status": asset_status,
        "lowest_subsystem_rul_hours": lowest_component_rul,
        "cleared_sortie_profiles_count": len(matched_sorties),
        "cleared_sortie_profiles": matched_sorties,
        "restricted_sortie_profiles": restricted_sorties,
        "tactical_disposition": tactical_disposition
    }
