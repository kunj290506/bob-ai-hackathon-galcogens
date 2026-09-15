"""
Database Seeding Script for D1 Mission Readiness & Predictive Maintenance Copilot.
Populates 20 military platforms, components, telemetry streams, predictions,
work orders, mission windows, and authorized defense personnel.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
import random
from src.backend.app.core.security import hash_password
from sqlalchemy import select

from src.backend.app.db.base import async_session_factory, init_db
from src.backend.app.db.models import (
    User, Asset, Component, SensorReading,
    Prediction, WorkOrder, MaintenanceRecord,
    MissionWindow, AuditLog
)
from src.backend.app.ml.predictor import FleetPredictor

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("DBSeeder")



async def seed_database():
    logger.info("Initializing database tables...")
    await init_db()

    async with async_session_factory() as session:
        # Check if already seeded
        existing_assets = await session.execute(select(Asset))
        if existing_assets.scalars().first() is not None:
            logger.info("Database is already seeded. Skipping re-seed.")
            return

        logger.info("Seeding defense personnel (Users)...")
        # 1. Users
        default_hash = hash_password("Galcogens@2026")
        users = [
            User(username="kunj.commander", email="d24aiml082@charusat.edu.in", hashed_password=default_hash, full_name="Col. Kunj (Commander)", role="commander", unit="388th Fighter Wing", clearance_level="TOP_SECRET"),
            User(username="vedant.maint", email="23aiml042@charusat.edu.in", hashed_password=default_hash, full_name="Maj. Vedant (Maintenance)", role="maintenance_officer", unit="388th Maintenance Group", clearance_level="SECRET"),
            User(username="path.logistics", email="23aiml055@charusat.edu.in", hashed_password=default_hash, full_name="Capt. Path (Logistics)", role="logistics_planner", unit="388th Logistics Readiness", clearance_level="SECRET"),
            User(username="venisha.tech", email="23dcs134@charusat.edu.in", hashed_password=default_hash, full_name="Sgt. Venisha (Lead Technician)", role="technician", unit="388th Component Repair Sq", clearance_level="SECRET"),
            User(username="admin.sys", email="admin@galcogens.mil", hashed_password=default_hash, full_name="System Administrator", role="admin", unit="HQ AMC", clearance_level="TOP_SECRET"),
        ]
        session.add_all(users)
        await session.flush()

        # 2. Mission Windows
        logger.info("Seeding upcoming operational mission windows...")
        now = datetime.utcnow()
        missions = [
            MissionWindow(
                title="Operation Desert Shield - Air Superiority Sweep",
                description="High-altitude combat air patrol and strike escort over Sector 4.",
                mission_type="COMBAT_AIR_PATROL",
                start_time=now + timedelta(hours=48),
                end_time=now + timedelta(hours=60),
                required_assets_count=4,
                required_asset_type="FIGHTER_JET",
                priority="CRITICAL",
                minimum_readiness_threshold=90.0
            ),
            MissionWindow(
                title="Operation Talon - Close Air Support & Escort",
                description="Low-level precision ground support for 1st Armored Division advance.",
                mission_type="CAS",
                start_time=now + timedelta(hours=72),
                end_time=now + timedelta(hours=84),
                required_assets_count=3,
                required_asset_type="ATTACK_HELICOPTER",
                priority="HIGH",
                minimum_readiness_threshold=85.0
            ),
            MissionWindow(
                title="Operation Iron Lift - Forward Tactical Resupply",
                description="Airdrop and dirt-strip tactical insertion of munitions and field medical supplies.",
                mission_type="STRATEGIC_TRANSPORT",
                start_time=now + timedelta(hours=96),
                end_time=now + timedelta(hours=108),
                required_assets_count=2,
                required_asset_type="TRANSPORT_AIRCRAFT",
                priority="MEDIUM",
                minimum_readiness_threshold=80.0
            )
        ]
        session.add_all(missions)
        await session.flush()

        # 3. Fleet Assets & Sub-components
        logger.info("Seeding 20 military platforms and components...")
        platforms_def = [
            # Fighters (8)
            ("F16-VIPER-101", "Viper Alpha 1", "FIGHTER_JET", "F-16C Block 50", "421st Fighter Sq", "Hill AFB", "NMC", 42.0),
            ("F16-VIPER-102", "Viper Alpha 2", "FIGHTER_JET", "F-16C Block 50", "421st Fighter Sq", "Hill AFB", "FMC", 96.5),
            ("F16-VIPER-103", "Viper Alpha 3", "FIGHTER_JET", "F-16C Block 50", "421st Fighter Sq", "Hill AFB", "PMC", 78.0),
            ("F16-VIPER-104", "Viper Alpha 4", "FIGHTER_JET", "F-16C Block 50", "421st Fighter Sq", "Hill AFB", "FMC", 94.0),
            ("F15-EAGLE-201", "Strike Eagle 1", "FIGHTER_JET", "F-15E Strike Eagle", "389th Fighter Sq", "Mountain Home AFB", "FMC", 98.0),
            ("F15-EAGLE-202", "Strike Eagle 2", "FIGHTER_JET", "F-15E Strike Eagle", "389th Fighter Sq", "Mountain Home AFB", "PMC", 72.0),
            ("F35-LIGHT-301", "Lightning 1", "FIGHTER_JET", "F-35A Lightning II", "34th Fighter Sq", "Hill AFB", "FMC", 99.0),
            ("F35-LIGHT-302", "Lightning 2", "FIGHTER_JET", "F-35A Lightning II", "34th Fighter Sq", "Hill AFB", "FMC", 95.0),
            
            # Helicopters (6)
            ("AH64-APACHE-401", "Apache Ghost 1", "ATTACK_HELICOPTER", "AH-64E Guardian", "1-227th Attack Bn", "Fort Cavazos", "NMC", 35.0),
            ("AH64-APACHE-402", "Apache Ghost 2", "ATTACK_HELICOPTER", "AH-64E Guardian", "1-227th Attack Bn", "Fort Cavazos", "FMC", 91.0),
            ("AH64-APACHE-403", "Apache Ghost 3", "ATTACK_HELICOPTER", "AH-64E Guardian", "1-227th Attack Bn", "Fort Cavazos", "FMC", 93.5),
            ("UH60-HAWK-501", "Black Hawk 1", "UTILITY_HELICOPTER", "UH-60M Black Hawk", "2-227th Aviation", "Fort Cavazos", "FMC", 97.0),
            ("UH60-HAWK-502", "Black Hawk 2", "UTILITY_HELICOPTER", "UH-60M Black Hawk", "2-227th Aviation", "Fort Cavazos", "PMC", 74.0),
            ("CH47-CHINOOK-601", "Chinook Heavy 1", "TRANSPORT_HELICOPTER", "CH-47F Chinook", "3-227th Aviation", "Fort Cavazos", "FMC", 92.0),
            
            # Armored Vehicles (4)
            ("M1A2-ABRAMS-701", "Iron Thunder 1", "MAIN_BATTLE_TANK", "M1A2 SEPv3 Abrams", "1st Armored Div", "Fort Bliss", "NMC", 48.0),
            ("M1A2-ABRAMS-702", "Iron Thunder 2", "MAIN_BATTLE_TANK", "M1A2 SEPv3 Abrams", "1st Armored Div", "Fort Bliss", "FMC", 95.0),
            ("M2A3-BRADLEY-801", "Warhammer 1", "INFANTRY_FIGHTING_VEHICLE", "M2A3 Bradley", "1st Armored Div", "Fort Bliss", "FMC", 94.0),
            ("M1126-STRYKER-901", "Ghost Rider 1", "ARMORED_PERSONNEL_CARRIER", "M1126 Stryker ICV", "2nd Cavalry Reg", "Vilseck", "FMC", 96.0),
            
            # Transports (2)
            ("C130-HERC-001", "Hercules Titan 1", "TRANSPORT_AIRCRAFT", "C-130J Super Hercules", "317th Airlift Wing", "Dyess AFB", "FMC", 98.0),
            ("C130-HERC-002", "Hercules Titan 2", "TRANSPORT_AIRCRAFT", "C-130J Super Hercules", "317th Airlift Wing", "Dyess AFB", "PMC", 76.0),
        ]

        predictor = FleetPredictor.get_instance()

        for code, name, a_type, model_str, sq, base_loc, status_str, readiness_val in platforms_def:
            flight_hrs = round(random.uniform(450.0, 2800.0), 1)
            cycles_cnt = int(flight_hrs * 0.8)
            
            asset = Asset(
                asset_code=code,
                name=name,
                asset_type=a_type,
                model=model_str,
                squadron=sq,
                base_location=base_loc,
                status=status_str,
                readiness_score=readiness_val,
                total_flight_hours=flight_hrs,
                total_cycles=cycles_cnt,
                last_maintenance_date=now - timedelta(days=random.randint(5, 45))
            )
            session.add(asset)
            await session.flush()

            # Create standard subcomponents
            comp_types = [
                ("Primary Propulsion / Turbofan", "TURBOFAN_ENGINE", f"ENG-{code[-3:]}"),
                ("Main Rotor / Gearbox Assembly", "ROTOR_GEARBOX", f"GBX-{code[-3:]}"),
                ("Primary Hydraulic Flight Control", "HYDRAULIC_ACTUATOR", f"HYD-{code[-3:]}"),
                ("Mission Avionics & Radar Array", "AVIONICS_RADAR", f"AVN-{code[-3:]}")
            ]

            for comp_name, comp_type, serial_num in comp_types:
                is_flagged_asset = code in ["F16-VIPER-101", "AH64-APACHE-401", "M1A2-ABRAMS-701"]
                is_flagged_comp = is_flagged_asset and comp_type == "TURBOFAN_ENGINE"

                if is_flagged_comp:
                    # Degradation Scenario
                    rul_est = round(random.uniform(14.0, 22.0), 1)
                    risk_tier = "CRITICAL"
                    comp_status = "CRITICAL"
                elif is_flagged_asset and comp_type == "ROTOR_GEARBOX":
                    rul_est = round(random.uniform(28.0, 38.0), 1)
                    risk_tier = "HIGH"
                    comp_status = "DEGRADED"
                elif status_str == "PMC" and comp_type == "HYDRAULIC_ACTUATOR":
                    rul_est = round(random.uniform(42.0, 55.0), 1)
                    risk_tier = "MEDIUM"
                    comp_status = "DEGRADED"
                else:
                    rul_est = round(random.uniform(95.0, 125.0), 1)
                    risk_tier = "LOW"
                    comp_status = "HEALTHY"

                component = Component(
                    asset_id=asset.id,
                    name=comp_name,
                    component_type=comp_type,
                    part_number=f"PN-DEF-{comp_type[:3]}-{random.randint(1000, 9999)}",
                    serial_number=f"SN-{serial_num}",
                    installed_at=now - timedelta(days=random.randint(60, 400)),
                    total_operating_hours=round(random.uniform(200.0, 1800.0), 1),
                    expected_lifespan_hours=2500.0,
                    current_rul=rul_est,
                    risk_level=risk_tier,
                    status=comp_status
                )
                session.add(component)
                await session.flush()

                # Generate synthetic telemetry mapped to realistic C-MAPSS parameters
                # Degraded units show thermal creep and pressure drops
                t30_bias = 25.0 if is_flagged_comp else random.uniform(-2.0, 2.0)
                t50_bias = 30.0 if is_flagged_comp else random.uniform(-3.0, 3.0)
                p30_bias = -6.0 if is_flagged_comp else random.uniform(-1.0, 1.0)
                bpr_bias = 0.12 if is_flagged_comp else random.uniform(-0.02, 0.02)

                telemetry_history = []
                for step in range(1, 12):
                    cycle_time = now - timedelta(hours=(12 - step) * 4)
                    snapshot = {
                        "unit_nr": 1,
                        "time_cycles": step,
                        "s_2": round(642.3 + random.gauss(0, 0.4), 2),
                        "s_3": round(1586.9 + t30_bias * (step / 11.0) + random.gauss(0, 1.5), 2),
                        "s_4": round(1402.8 + t50_bias * (step / 11.0) + random.gauss(0, 1.8), 2),
                        "s_7": round(553.9 + p30_bias * (step / 11.0) + random.gauss(0, 0.5), 2),
                        "s_8": round(2388.0 + random.gauss(0, 0.2), 2),
                        "s_9": round(9060.0 + random.gauss(0, 5.0), 2),
                        "s_11": round(47.3 + random.gauss(0, 0.1), 2),
                        "s_12": round(521.9 + random.gauss(0, 0.3), 2),
                        "s_13": round(2388.0 + random.gauss(0, 0.2), 2),
                        "s_14": round(8130.0 + random.gauss(0, 4.0), 2),
                        "s_15": round(8.41 + bpr_bias * (step / 11.0) + random.gauss(0, 0.01), 3),
                        "s_17": round(393.0 + random.gauss(0, 1.0), 1),
                        "s_20": round(38.9 + random.gauss(0, 0.1), 2),
                        "s_21": round(23.3 + random.gauss(0, 0.08), 2),
                    }
                    telemetry_history.append(snapshot)

                    # Save critical sensor readings to DB
                    if step in [10, 11]:
                        for s_id, s_val in [("s_3", snapshot["s_3"]), ("s_4", snapshot["s_4"]), ("s_7", snapshot["s_7"]), ("s_15", snapshot["s_15"])]:
                            is_s_anom = is_flagged_comp and s_id in ["s_3", "s_4", "s_7"]
                            reading = SensorReading(
                                component_id=component.id,
                                timestamp=cycle_time,
                                sensor_type=s_id,
                                value=s_val,
                                unit="deg R" if s_id in ["s_3", "s_4"] else ("psia" if s_id == "s_7" else ""),
                                is_anomalous=is_s_anom,
                                anomaly_score=0.88 if is_s_anom else 0.15
                            )
                            session.add(reading)

                # Run FleetPredictor inference on the history
                pred_result = predictor.predict_component_health(telemetry_history, mission_window_hours=48.0)
                
                prediction = Prediction(
                    component_id=component.id,
                    predicted_at=now,
                    predicted_rul=pred_result["predicted_rul"],
                    confidence_interval_lower=pred_result["confidence_interval"][0],
                    confidence_interval_upper=pred_result["confidence_interval"][1],
                    risk_level=pred_result["risk_level"],
                    anomaly_score=pred_result["anomaly_score"],
                    fails_before_mission=pred_result["fails_before_mission"],
                    explanation=pred_result["explanation"],
                    model_version="xgb-v1.0-cuda"
                )
                session.add(prediction)
                await session.flush()

                # Generate AI Work Order if critical or high risk
                if pred_result["fails_before_mission"] or pred_result["risk_level"] in ["CRITICAL", "HIGH"]:
                    work_order = WorkOrder(
                        asset_id=asset.id,
                        component_id=component.id,
                        prediction_id=prediction.id,
                        priority="CRITICAL" if pred_result["risk_level"] == "CRITICAL" else "HIGH",
                        status="PENDING",
                        title=f"URGENT: Predictive Overhaul required for {asset.name} ({comp_name})",
                        description=f"Automated AI recommendation: {pred_result['explanation']}. Estimated RUL ({pred_result['predicted_rul']} hrs) breaches mission window.",
                        estimated_hours=6.5 if comp_type == "TURBOFAN_ENGINE" else 4.0,
                        required_parts=json.dumps([f"SEAL-KIT-{comp_type[:3]}", f"BEARING-ASSY-{comp_type[:3]}"]),
                        assigned_to="Sgt. Venisha (Lead Technician)",
                        created_by_ai=True,
                        due_date=now + timedelta(hours=36)
                    )
                    session.add(work_order)

            # Historical maintenance records
            maint_hist = MaintenanceRecord(
                asset_id=asset.id,
                maintenance_type="SCHEDULED",
                title="100-Hour Phase Inspection & Avionics Calibration",
                description="Routine airframe lubrication, flight control test, and HUMS sensor calibration.",
                performed_by="388th Maintenance Group",
                completed_at=now - timedelta(days=20),
                downtime_hours=8.0,
                parts_replaced=json.dumps(["FILTER-E1", "O-RING-HYD-4"]),
                notes="All primary systems certified FMC upon completion."
            )
            session.add(maint_hist)

        # Audit Log Entry
        audit = AuditLog(
            username="SYSTEM",
            action="DATABASE_SEED",
            entity_type="SYSTEM",
            details_json=json.dumps({"seeded_assets": len(platforms_def), "status": "SUCCESS"}),
            ip_address="127.0.0.1"
        )
        session.add(audit)
        await session.commit()
        logger.info("Successfully seeded 20 assets, components, telemetry, ML predictions, and work orders!")


if __name__ == "__main__":
    asyncio.run(seed_database())
