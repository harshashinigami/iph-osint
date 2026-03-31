from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Report

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


@router.get("")
async def list_reports(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Report).order_by(Report.created_at.desc()))
    reports = result.scalars().all()
    return [
        {
            "id": str(r.id),
            "title": r.title,
            "report_type": r.report_type,
            "file_format": r.file_format,
            "created_at": r.created_at.isoformat(),
        }
        for r in reports
    ]


@router.post("/generate")
async def generate_report(data: dict, db: AsyncSession = Depends(get_db)):
    # Will be implemented in Phase 5
    report = Report(
        title=data.get("title", "E-SitRep Report"),
        report_type=data.get("report_type", "sitrep"),
        parameters=data.get("parameters", {}),
        file_format=data.get("format", "pdf"),
    )
    db.add(report)
    await db.commit()
    return {"id": str(report.id), "status": "generating"}
