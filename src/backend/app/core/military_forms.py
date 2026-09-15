"""
AFTO Form 781A & DA Form 2404 Military Maintenance Document Generator.
Generates defense-compliant maintenance discrepancy forms with military symbols
(Red X, Red Dash, Red Diagonal), corrective action codes, and NSN parts manifests.
"""

from datetime import datetime
from typing import Dict, Any, List


def generate_afto_form_781a(
    asset_code: str,
    asset_model: str,
    serial_number: str,
    component_name: str,
    issue_description: str,
    severity: str = "CRITICAL",
    predicted_rul: float = 18.4,
    dispatched_tech: str = "Sgt. Venisha (Lead Technician)"
) -> Dict[str, Any]:
    """
    Generates an official digital AFTO Form 781A (Aerospace Vehicle Maintenance Discrepancy Document).
    """
    is_critical = severity.upper() == "CRITICAL" or predicted_rul <= 24.0
    symbol = "RED_X" if is_critical else ("RED_DIAGONAL" if severity.upper() == "HIGH" else "RED_DASH")
    symbol_display = "X" if symbol == "RED_X" else ("/" if symbol == "RED_DIAGONAL" else "-")

    job_control_number = f"JCN-{datetime.utcnow().strftime('%y%j')}-{asset_code[-3:]}1"
    discrepancy_narrative = (
        f"HUMS TELEMETRY ANOMALY CONFIRMED: {component_name} exhibiting severe thermal/vibration excursion. "
        f"XGBoost prognostics indicate remaining useful life of {predicted_rul} flight hours. "
        f"Exceeds mission safety limits. {issue_description}"
    )

    corrective_action = (
        f"Disassemble forward turbine casing. Perform borescope inspection on HP compressor and LP turbine blade stages. "
        f"Replace degraded carbon seals and high-pressure oil bearings. Perform ground run-up telemetry leak check."
    )

    nsn_parts = [
        {"nsn": "2840-01-523-8821", "part_name": "Turbine Carbon Seal Ring", "qty": 2, "unit": "EA"},
        {"nsn": "3110-00-142-9904", "part_name": "High-Temp Roller Bearing Assy", "qty": 1, "unit": "EA"},
        {"nsn": "5330-01-298-4412", "part_name": "Synthetic Hydrocarbon O-Ring Pack", "qty": 1, "unit": "KT"}
    ]

    return {
        "form_id": "AFTO-781A",
        "form_title": "AEROSPACE VEHICLE MAINTENANCE DISCREPANCY & WORK DOCUMENT",
        "document_tracking_id": job_control_number,
        "date_dispatched": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
        "platform_data": {
            "tail_number": asset_code,
            "mission_design_series": asset_model,
            "serial_number": serial_number,
            "airworthiness_status": "GROUNDED (RED X)" if is_critical else "MISSION DEGRADED (RED /)"
        },
        "discrepancy_block": {
            "symbol": symbol,
            "symbol_display": symbol_display,
            "symbol_meaning": "Grounding condition; vehicle unsafe for flight until cleared." if is_critical else "Minor defect; flight permitted under restricted flight envelope.",
            "discrepancy_narrative": discrepancy_narrative,
            "reported_by": "BOB-COPILOT-AUTONOMOUS-DIAGNOSTIC-SYSTEM",
            "jcn": job_control_number
        },
        "corrective_action_block": {
            "action_code": "REPLACE_AND_RECERTIFY (J-CODE 02)",
            "work_center": "PROPULSION REPAIR FACILITY (PRF-388)",
            "corrective_narrative": corrective_action,
            "estimated_man_hours": 6.5,
            "lead_technician": dispatched_tech,
            "inspector_certification": "PENDING CHIEF INSPECTOR SIGN-OFF"
        },
        "parts_manifest": nsn_parts,
        "is_cleared_for_flight": not is_critical
    }
