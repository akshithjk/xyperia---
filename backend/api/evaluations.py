from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.auth import get_current_user
from db.database import get_db
from db.models import PatientEvaluation

router = APIRouter(prefix="/evaluations", tags=["evaluations"])

@router.get("/latest")
async def get_latest_evaluations(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Only get the latest evaluations
    query = select(PatientEvaluation).order_by(PatientEvaluation.evaluated_at.desc()).limit(100)
    result = await db.execute(query)
    evaluations = result.scalars().all()
    
    return {"data": evaluations}
