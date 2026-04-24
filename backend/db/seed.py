import asyncio
import os
import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import sessionmaker

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.db.database import engine, Base, AsyncSessionLocal
from backend.db.models import (
    User, Trial, TrialSite, Patient, BiomarkerReading, 
    Guideline, Rule, RuleStatus, GuidelineStatus, EvaluationStatus, PatientEvaluation
)

async def seed_db():
    print("Initializing Database...")
    async with engine.begin() as conn:
        # For demo purposes, we recreate tables to start fresh
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        print("Seeding Users...")
        users = [
            User(id="user-1", email="priya@xypheria.com", name="Priya S.", role="REGULATORY_AFFAIRS", org_id="org-xypheria", trial_ids=["trial-glucozen"], hashed_password="dummy"),
            User(id="user-2", email="arjun@xypheria.com", name="Arjun M.", role="DATA_MANAGER", org_id="org-xypheria", trial_ids=["trial-glucozen"], hashed_password="dummy"),
            User(id="user-3", email="ramesh@xypheria.com", name="Dr. Ramesh K.", role="DOCTOR", org_id="org-xypheria", site_id="site-3", trial_ids=["trial-glucozen"], hashed_password="dummy")
        ]
        session.add_all(users)

        print("Seeding Trials and Sites...")
        trial = Trial(
            id="trial-glucozen", name="GlucoZen Phase III", sponsor_org_id="org-xypheria",
            phase="Phase III", indication="Type 2 Diabetes", status="ACTIVE", enrolled_count=500, sites_count=10
        )
        session.add(trial)

        sites = []
        for i in range(1, 11):
            hospital = "Apollo Hospitals Chennai" if i == 3 else f"Trial Center {i}"
            city = "Chennai" if i == 3 else f"City {i}"
            pi = "user-3" if i == 3 else f"demo-pi-{i}"
            sites.append(TrialSite(
                id=f"site-{i}", trial_id="trial-glucozen", hospital_name=hospital,
                city=city, country="India", pi_user_id=pi, patient_count=50, status="ACTIVE"
            ))
        session.add_all(sites)
        await session.flush()

        print("Seeding 500 Patients & Readings...")
        patients = []
        readings = []
        
        now = datetime.now(timezone.utc)
        
        # We need specific target patients from the frontend demo:
        # PT-8091 (Site 3, HRV=24), PT-1102 (Site 3, HRV=26), PT-4399 (Site 8, HRV=27.5)
        target_patients = {
            "PT-8091": {"site": "site-3", "hrv": 24.0, "status": "AT_RISK"},
            "PT-1102": {"site": "site-3", "hrv": 26.0, "status": "AT_RISK"},
            "PT-4399": {"site": "site-8", "hrv": 27.5, "status": "AT_RISK"}
        }

        patient_count = 1
        for site in sites:
            for _ in range(50):
                pid = f"PT-{patient_count:04d}"
                
                # Check if we need to insert our target patients
                # We overwrite the first few to be our specific ones
                if site.id == "site-3" and pid == "PT-0101": pid = "PT-8091"
                elif site.id == "site-3" and pid == "PT-0102": pid = "PT-1102"
                elif site.id == "site-8" and pid == "PT-0351": pid = "PT-4399"
                
                is_target = pid in target_patients
                target_data = target_patients.get(pid, {})
                
                p = Patient(
                    id=f"db-{pid}", trial_id="trial-glucozen", site_id=site.id,
                    external_id=pid, enrolled_at=now - timedelta(days=60),
                    status=target_data.get("status", "ACTIVE")
                )
                patients.append(p)
                
                # Generate 30 days of HRV readings
                base_hrv = target_data.get("hrv", random.uniform(30.0, 50.0))
                for day in range(30):
                    rec_time = now - timedelta(days=29 - day)
                    # Add noise but ensure the last reading is exactly the target HRV
                    if day == 29 and is_target:
                        val = base_hrv
                    else:
                        val = base_hrv + random.uniform(-2.0, 5.0) if is_target else random.uniform(30.0, 50.0)
                        
                    readings.append(BiomarkerReading(
                        patient_id=p.id, biomarker="HRV_SDNN", value=val, unit="ms",
                        recorded_at=rec_time, device_id="wearable-x1", source="Apple Watch", quality_flag="HIGH"
                    ))
                    
                patient_count += 1
                
        session.add_all(patients)
        await session.flush()
        
        # Batch insert readings
        chunk_size = 5000
        for i in range(0, len(readings), chunk_size):
            session.add_all(readings[i:i+chunk_size])
        
        print("Seeding Guidelines, Rules and Evaluations...")
        g1 = Guideline(source="FDA Website", pdf_url="FDA_Cardiac_Guidance_2026.pdf", pdf_hash="hash123", status=GuidelineStatus.PROCESSED, raw_text_path="...")
        session.add(g1)
        await session.flush()
        
        rule_v12 = Rule(version="v1.2", trial_id="trial-glucozen", biomarker="HRV_SDNN", operator="LT", threshold=25.0, status=RuleStatus.SUPERSEDED, source_guideline_id=g1.id)
        rule_v13 = Rule(version="v1.3", trial_id="trial-glucozen", biomarker="HRV_SDNN", operator="LT", threshold=28.0, status=RuleStatus.ACTIVE, source_guideline_id=g1.id, diff_summary={"old": 25.0, "new": 28.0})
        session.add_all([rule_v12, rule_v13])
        await session.flush()

        # Add evaluations for the target patients to show up in alerts
        evals = []
        for pid, data in target_patients.items():
            db_pid = f"db-{pid}"
            # For PT-8091 (HRV=24), it was AT_RISK in v1.2 (<25) and v1.3 (<28)
            # For PT-1102 (HRV=26), it was SAFE in v1.2 (<25) but AT_RISK in v1.3 (<28)
            old_status = EvaluationStatus.AT_RISK if data["hrv"] < 25.0 else EvaluationStatus.SAFE
            
            evals.append(PatientEvaluation(
                patient_id=db_pid, rule_id=rule_v13.id, old_rule_id=rule_v12.id,
                old_status=old_status, new_status=EvaluationStatus.AT_RISK,
                current_value=data["hrv"], flagged=True, evaluation_triggered_by="System"
            ))
        session.add_all(evals)

        await session.commit()
        print("Database Seeded Successfully!")

if __name__ == "__main__":
    asyncio.run(seed_db())
