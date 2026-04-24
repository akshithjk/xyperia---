from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.auth import get_current_user
from db.database import get_db
from db.models import PVReport

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/")
async def get_reports(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(PVReport).order_by(PVReport.generated_at.desc())
    result = await db.execute(query)
    reports = result.scalars().all()
    
    return {"data": reports}

@router.get("/{id}/pdf")
async def get_report_pdf(
    id: int, 
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        from weasyprint import HTML
        
        html_content = f"""
        <html>
        <head>
            <style>
                body {{ font-family: 'Helvetica', sans-serif; color: #1e293b; line-height: 1.6; padding: 40px; }}
                h1 {{ color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }}
                h2 {{ color: #334155; margin-top: 30px; }}
                .metric {{ background: #f8fafc; padding: 15px; border-left: 4px solid #3b82f6; margin-bottom: 20px; }}
                .alert {{ background: #fef2f2; color: #b91c1c; padding: 15px; border-left: 4px solid #ef4444; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
                th, td {{ padding: 12px; border: 1px solid #e2e8f0; text-align: left; }}
                th {{ background: #f1f5f9; }}
            </style>
        </head>
        <body>
            <h1>Pharmacovigilance Safety Report</h1>
            <p><strong>Report ID:</strong> PV-{id}</p>
            <p><strong>Date Generated:</strong> 2026-03-15</p>
            
            <h2>Executive Summary</h2>
            <div class="alert">
                <strong>CRITICAL ALERT:</strong> New regulatory guideline mandates HRV SDNN threshold revision to 28ms.
            </div>
            
            <h2>Impact Analysis</h2>
            <div class="metric">
                <p><strong>Total Patients Evaluated:</strong> 500</p>
                <p><strong>Patients Flagged AT RISK:</strong> 37</p>
                <p><strong>Affected Trial:</strong> GlucoZen Phase III (trial-glucozen-001)</p>
            </div>
            
            <h2>Recommended Actions</h2>
            <ul>
                <li>Suspend dosing for flagged patients pending clinical review.</li>
                <li>Submit IND safety report to FDA within 15 days.</li>
                <li>Approve Rule v1.3 in ReguVigil to enforce the new 28ms threshold globally.</li>
            </ul>
        </body>
        </html>
        """
        
        pdf_bytes = HTML(string=html_content).write_pdf()
        
        return Response(
            content=pdf_bytes, 
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=PV_Report_{id}.pdf"}
        )
    except Exception as e:
        import logging
        logging.error(f"Failed to generate PDF: {e}")
        return Response(status_code=500, content="Failed to generate PDF")
