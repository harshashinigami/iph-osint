import uuid
from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Report
from app.reports.generator import gather_report_data, generate_pdf, generate_docx

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
            "file_path": r.file_path,
            "created_at": r.created_at.isoformat(),
        }
        for r in reports
    ]


@router.post("/generate")
async def generate_report(data: dict, db: AsyncSession = Depends(get_db)):
    report_data = await gather_report_data(db, days=7)
    file_format = data.get("format", "pdf")
    file_id = uuid.uuid4().hex[:8]
    title = data.get("title", f"E-SitRep — {report_data['generated_at']}")

    if file_format == "docx":
        filename = f"sitrep_{file_id}.docx"
        filepath = generate_docx(report_data, filename)
    else:
        filename = f"sitrep_{file_id}.pdf"
        filepath = generate_pdf(report_data, filename)

    report = Report(
        title=title,
        report_type=data.get("report_type", "sitrep"),
        parameters={"days": 7, "format": file_format},
        content=report_data,
        file_path=filepath,
        file_format=file_format,
    )
    db.add(report)
    await db.commit()

    return {"id": str(report.id), "title": title, "format": file_format, "status": "ready"}


@router.get("/{report_id}/download")
async def download_report(report_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report or not report.file_path:
        return {"error": "Report not found"}
    media_type = "application/pdf" if report.file_format == "pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    return FileResponse(report.file_path, media_type=media_type, filename=f"ILA_E-SitRep.{report.file_format}")
