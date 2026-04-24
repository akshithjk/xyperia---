from fastapi import APIRouter, Depends, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi.responses import StreamingResponse
import csv
import io
from core.auth import get_current_user
from db.database import get_db
from db.models import Patient, TrialSite

router = APIRouter(prefix="/patients", tags=["patients"])

@router.get("/")
async def get_patients(
    request: Request,
    export: str = Query(None),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    site_id = getattr(request.state, "site_id", None)
    
    query = select(Patient)
    if site_id:
        query = query.where(Patient.site_id == site_id)
        
    result = await db.execute(query)
    patients = result.scalars().all()
    
    # Normally we would join with PatientEvaluation to get flagged status
    # For now, we return basic patient info
    
    if export == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Patient ID", "Site ID", "Status", "Enrolled At"])
        
        for p in patients:
            writer.writerow([p.id, p.site_id, p.status, p.enrolled_at])
            
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]), 
            media_type="text/csv", 
            headers={"Content-Disposition": "attachment; filename=patients_export.csv"}
        )
        
    return {"data": patients, "site_scope": site_id}

@router.get("/{id}")
async def get_patient(
    id: str, 
    request: Request, 
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    site_id = getattr(request.state, "site_id", None)
    
    query = select(Patient).where(Patient.id == id)
    if site_id:
        query = query.where(Patient.site_id == site_id)
        
    result = await db.execute(query)
    patient = result.scalars().first()
    
    if not patient:
        return {"error": "Patient not found or unauthorized"}
        
    return {"data": patient, "site_scope": site_id}

@router.get("/{id}/readings")
async def get_patient_readings(
    id: str, 
    request: Request, 
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from db.models import BiomarkerReading
    
    query = select(BiomarkerReading).where(BiomarkerReading.patient_id == id).order_by(BiomarkerReading.recorded_at.asc())
    result = await db.execute(query)
    readings = result.scalars().all()
    
    return {"id": id, "readings": readings}
