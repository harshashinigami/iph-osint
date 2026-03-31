import asyncio
import json
from datetime import datetime

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
try:
    from sse_starlette.sse import EventSourceResponse
    SSE_AVAILABLE = True
except ImportError:
    SSE_AVAILABLE = False

from app.database import get_db
from app.models import Alert, AlertRule

router = APIRouter(prefix="/api/v1/alerts", tags=["alerts"])


@router.get("")
async def list_alerts(
    severity: str = None, alert_type: str = None, is_read: bool = None,
    limit: int = 50, offset: int = 0, db: AsyncSession = Depends(get_db)
):
    query = select(Alert).order_by(Alert.created_at.desc()).limit(limit).offset(offset)
    if severity:
        query = query.where(Alert.severity == severity)
    if alert_type:
        query = query.where(Alert.alert_type == alert_type)
    if is_read is not None:
        query = query.where(Alert.is_read == is_read)
    result = await db.execute(query)
    alerts = result.scalars().all()
    return [
        {
            "id": str(a.id),
            "title": a.title,
            "description": a.description,
            "severity": a.severity,
            "alert_type": a.alert_type,
            "is_read": a.is_read,
            "is_acknowledged": a.is_acknowledged,
            "metadata": a.extra_data,
            "created_at": a.created_at.isoformat(),
        }
        for a in alerts
    ]


@router.patch("/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, db: AsyncSession = Depends(get_db)):
    await db.execute(
        update(Alert).where(Alert.id == alert_id).values(is_acknowledged=True, is_read=True)
    )
    await db.commit()
    return {"id": alert_id, "acknowledged": True}


@router.patch("/bulk-read")
async def bulk_read(data: dict, db: AsyncSession = Depends(get_db)):
    ids = data.get("ids", [])
    if ids:
        await db.execute(update(Alert).where(Alert.id.in_(ids)).values(is_read=True))
        await db.commit()
    return {"updated": len(ids)}


@router.get("/rules")
async def list_rules(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AlertRule).order_by(AlertRule.created_at.desc()))
    rules = result.scalars().all()
    return [
        {
            "id": str(r.id),
            "name": r.name,
            "rule_type": r.rule_type,
            "config": r.config,
            "severity": r.severity,
            "is_active": r.is_active,
        }
        for r in rules
    ]


@router.post("/rules")
async def create_rule(data: dict, db: AsyncSession = Depends(get_db)):
    rule = AlertRule(
        name=data["name"],
        rule_type=data["rule_type"],
        config=data["config"],
        severity=data.get("severity", "medium"),
    )
    db.add(rule)
    await db.commit()
    return {"id": str(rule.id), "name": rule.name}


@router.get("/stats")
async def alert_stats(db: AsyncSession = Depends(get_db)):
    total = (await db.execute(select(func.count(Alert.id)))).scalar() or 0
    by_severity = await db.execute(
        select(Alert.severity, func.count(Alert.id).label("count")).group_by(Alert.severity)
    )
    unread = (await db.execute(select(func.count(Alert.id)).where(Alert.is_read == False))).scalar() or 0
    return {
        "total": total,
        "unread": unread,
        "by_severity": {r.severity: r.count for r in by_severity.fetchall()},
    }


@router.get("/stream")
async def stream_alerts(request: Request, db: AsyncSession = Depends(get_db)):
    """SSE endpoint that streams new alerts every 5 seconds."""
    if not SSE_AVAILABLE:
        return {"error": "sse-starlette not installed"}

    # Track the most recent alert seen at connection time
    result = await db.execute(
        select(Alert.created_at).order_by(Alert.created_at.desc()).limit(1)
    )
    row = result.scalar_one_or_none()
    last_seen: datetime = row if row else datetime.utcfromtimestamp(0)

    async def event_generator():
        nonlocal last_seen
        while True:
            if await request.is_disconnected():
                break

            # Use a fresh session for each poll to avoid stale state
            from app.database import async_session
            async with async_session() as poll_db:
                new_alerts_result = await poll_db.execute(
                    select(Alert)
                    .where(Alert.created_at > last_seen)
                    .order_by(Alert.created_at.asc())
                )
                new_alerts = new_alerts_result.scalars().all()

            if new_alerts:
                last_seen = new_alerts[-1].created_at
                for alert in new_alerts:
                    payload = {
                        "id": str(alert.id),
                        "title": alert.title,
                        "description": alert.description,
                        "severity": alert.severity,
                        "alert_type": alert.alert_type,
                        "is_read": alert.is_read,
                        "is_acknowledged": alert.is_acknowledged,
                        "metadata": alert.extra_data,
                        "created_at": alert.created_at.isoformat(),
                    }
                    yield {"event": "alert", "data": json.dumps(payload)}

            await asyncio.sleep(5)

    return EventSourceResponse(event_generator())
