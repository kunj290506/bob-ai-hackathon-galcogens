"""
Mission-Adaptive Sortie Re-allocation & Air Tasking Order (ATO) Matching Engine.
Instead of binary grounding (NMC), dynamically reallocates partially degraded platforms
to compatible lower-stress mission profiles, preserving squadron combat generation,
and computes asset-to-asset substitution matrices when a primary asset is unready.
"""

from typing import Dict, List, Any, Optional

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

SORTIE_MAP = {p["code"]: p for p in SORTIE_PROFILES}


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


def reallocate_mission_sortie(
    primary_asset: Dict[str, Any],
    candidate_assets: List[Dict[str, Any]],
    required_profile_code: str = "CAP_HEAVY",
    mission_duration_hours: float = 6.0
) -> Dict[str, Any]:
    """
    Evaluates tactical sortie substitution when a primary asset is unready or degraded.
    Considers mission profile envelopes, RUL margins, availability, and component health.
    
    Returns structured explanation of alternative asset selection or grounds mission if
    no qualified substitute exists.
    """
    profile = SORTIE_MAP.get(required_profile_code, SORTIE_PROFILES[0])
    req_rul = profile["min_rul_hours"] + mission_duration_hours

    # 1. Check Primary Asset Viability
    pri_status = primary_asset.get("status", "NMC")
    pri_available = primary_asset.get("is_available", True) and not primary_asset.get("in_maintenance", False)
    pri_rul = float(primary_asset.get("lowest_component_rul", 0.0))
    pri_has_critical_failure = primary_asset.get("has_critical_flight_component_failure", False)

    is_primary_viable = (
        pri_available and
        not pri_has_critical_failure and
        pri_status in profile["allowed_status"] and
        pri_rul >= req_rul
    )

    if is_primary_viable:
        return {
            "verdict": "PRIMARY_ASSIGNED",
            "required_profile": profile["code"],
            "profile_name": profile["name"],
            "selected_asset_code": primary_asset.get("asset_code"),
            "selected_asset_name": primary_asset.get("name"),
            "is_alternative": False,
            "explanation": f"Primary asset {primary_asset.get('asset_code')} is fully available and satisfies all {profile['code']} profile requirements (RUL {pri_rul:.1f}h >= required {req_rul:.1f}h).",
            "candidate_evaluations": []
        }

    # Primary asset cannot execute the mission
    primary_disqualification = []
    if not pri_available:
        primary_disqualification.append("Primary asset currently committed or in depot maintenance")
    if pri_has_critical_failure or pri_status not in profile["allowed_status"]:
        primary_disqualification.append(f"Status '{pri_status}' prohibited for profile {profile['code']}")
    if pri_rul < req_rul:
        primary_disqualification.append(f"Lowest subsystem RUL ({pri_rul:.1f}h) below threshold ({req_rul:.1f}h)")

    # 2. Evaluate Candidate Platforms
    qualified_candidates = []
    disqualified_candidates = []

    for cand in candidate_assets:
        code = cand.get("asset_code", "UNKNOWN")
        cand_status = cand.get("status", "NMC")
        cand_available = cand.get("is_available", True) and not cand.get("in_maintenance", False)
        cand_rul = float(cand.get("lowest_component_rul", 0.0))
        cand_has_critical_failure = cand.get("has_critical_flight_component_failure", False)
        cand_score = float(cand.get("readiness_score", 70.0))

        reasons = []
        if not cand_available:
            reasons.append("Currently assigned to active sortie or undergoing overhaul")
        if cand_has_critical_failure or cand_status not in profile["allowed_status"]:
            reasons.append(f"Readiness status '{cand_status}' ineligible for {profile['code']}")
        if cand_rul < req_rul:
            reasons.append(f"RUL margin deficit ({cand_rul:.1f}h < required {req_rul:.1f}h)")

        if not reasons:
            # Candidate is qualified
            # Ranking score: 40% readiness score, 40% RUL headroom, 20% base compatibility
            rul_margin = cand_rul - req_rul
            rank_score = round(cand_score * 0.4 + min(100.0, rul_margin * 2.0) * 0.4 + 20.0, 1)
            qualified_candidates.append({
                "asset_code": code,
                "asset_name": cand.get("name"),
                "readiness_score": cand_score,
                "status": cand_status,
                "lowest_component_rul": cand_rul,
                "rul_margin_hours": round(rul_margin, 1),
                "rank_score": rank_score
            })
        else:
            disqualified_candidates.append({
                "asset_code": code,
                "asset_name": cand.get("name"),
                "status": cand_status,
                "disqualification_reasons": reasons
            })

    # Sort qualified descending by rank_score
    qualified_candidates.sort(key=lambda c: c["rank_score"], reverse=True)

    if not qualified_candidates:
        return {
            "verdict": "NO_ALTERNATIVE_AVAILABLE",
            "required_profile": profile["code"],
            "profile_name": profile["name"],
            "primary_asset_code": primary_asset.get("asset_code"),
            "primary_disqualification": primary_disqualification,
            "selected_asset_code": None,
            "is_alternative": False,
            "explanation": f"SORTIE ABORT: Primary platform {primary_asset.get('asset_code')} unavailable ({'; '.join(primary_disqualification)}), and zero qualified alternatives in squadron meet {profile['code']} requirements.",
            "qualified_count": 0,
            "disqualified_candidates": disqualified_candidates
        }

    best_candidate = qualified_candidates[0]
    is_single_choice = len(qualified_candidates) == 1

    if is_single_choice:
        expl = (
            f"REALLOCATED (SOLE ALTERNATIVE): Primary platform {primary_asset.get('asset_code')} unavailable ({'; '.join(primary_disqualification)}). "
            f"Asset {best_candidate['asset_code']} ({best_candidate['status']}, RUL {best_candidate['lowest_component_rul']:.1f}h) selected as the sole qualified airframe meeting {profile['code']} parameters."
        )
    else:
        other_codes = [c["asset_code"] for c in qualified_candidates[1:]]
        expl = (
            f"REALLOCATED (OPTIMAL ALTERNATIVE): Primary platform {primary_asset.get('asset_code')} unavailable ({'; '.join(primary_disqualification)}). "
            f"Asset {best_candidate['asset_code']} selected from {len(qualified_candidates)} eligible platforms (scoring {best_candidate['rank_score']} vs competitors {', '.join(other_codes)}) due to superior RUL margin (+{best_candidate['rul_margin_hours']:.1f}h) and {best_candidate['status']} condition."
        )

    return {
        "verdict": "ALTERNATIVE_ASSIGNED",
        "required_profile": profile["code"],
        "profile_name": profile["name"],
        "primary_asset_code": primary_asset.get("asset_code"),
        "primary_disqualification": primary_disqualification,
        "selected_asset_code": best_candidate["asset_code"],
        "selected_asset_name": best_candidate["asset_name"],
        "is_alternative": True,
        "selected_asset_details": best_candidate,
        "explanation": expl,
        "qualified_candidates_count": len(qualified_candidates),
        "qualified_candidates": qualified_candidates,
        "disqualified_candidates": disqualified_candidates
    }
