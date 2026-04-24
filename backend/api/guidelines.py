from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.auth import get_current_user
from db.database import get_db
from db.models import Guideline, GuidelineStatus

router = APIRouter(prefix="/guidelines", tags=["guidelines"])

@router.get("/")
async def get_guidelines(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Guideline).order_by(Guideline.created_at.desc())
    result = await db.execute(query)
    guidelines = result.scalars().all()
    
    return {"data": guidelines}

from fastapi import BackgroundTasks
from agents.pipeline import run_pipeline_async
import uuid
import os
from datetime import datetime, timezone
from db.models import PipelineRun

@router.get("/stats/count")
async def get_guideline_stats(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import func
    # Example stats: total guidelines processed
    query = select(func.count(Guideline.id)).where(Guideline.status == GuidelineStatus.PROCESSED)
    result = await db.execute(query)
    count = result.scalar()
    return {"processed": count, "pending": 0}

@router.post("/upload")
async def upload_guideline(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(None),
    pdf_url: str = Form(None),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    filename = file.filename if file else "sample_fda_guideline.pdf"
    
    # Save the file locally if uploaded
    if file:
        file_path = f"/app/{filename}"
        with open(file_path, "wb") as f:
            f.write(await file.read())
    else:
        file_path = "sample_fda_guideline.pdf" # Use root path

    new_guideline = Guideline(
        source="Uploaded Document" if file else "URL Import",
        pdf_url=pdf_url or filename,
        pdf_hash="placeholder_hash",
        status=GuidelineStatus.HUMAN_REVIEW
    )
    
    db.add(new_guideline)
    await db.commit()
    await db.refresh(new_guideline)
    
    # Check if there's a RUNNING pipeline
    check_query = select(PipelineRun).filter_by(overall_status="RUNNING")
    res = await db.execute(check_query)
    if not res.scalar_one_or_none():
        # Create a new run record
        run_id = f"run_{uuid.uuid4().hex[:8]}"
        new_run = PipelineRun(
            id=run_id,
            guideline_id=new_guideline.id,
            overall_status="PENDING",
            started_at=datetime.now(timezone.utc)
        )
        db.add(new_run)
        await db.commit()
        
        # Trigger pipeline
        background_tasks.add_task(run_pipeline_async, run_id, new_guideline.id, file_path)
    
    return {"status": "processing", "guideline_id": new_guideline.id}

@router.get("/{id}")
async def get_guideline(
    id: int, 
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Guideline).where(Guideline.id == id)
    result = await db.execute(query)
    guideline = result.scalars().first()
    
    if not guideline:
        return {"error": "Guideline not found"}
        
    return {"data": guideline}
