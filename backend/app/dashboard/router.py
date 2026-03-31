from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from datetime import datetime, timedelta
from app.database import get_db
from app.models import RawPost, ProcessedPost, Entity, Alert, Source

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    day_ago = now - timedelta(days=1)

    total_posts = (await db.execute(select(func.count(RawPost.id)))).scalar() or 0
    posts_24h = (await db.execute(select(func.count(RawPost.id)).where(RawPost.collected_at >= day_ago))).scalar() or 0
    total_entities = (await db.execute(select(func.count(Entity.id)))).scalar() or 0
    active_alerts = (await db.execute(select(func.count(Alert.id)).where(Alert.is_acknowledged == False))).scalar() or 0
    active_sources = (await db.execute(select(func.count(Source.id)).where(Source.is_active == True))).scalar() or 0

    return {
        "total_posts": total_posts,
        "posts_24h": posts_24h,
        "total_entities": total_entities,
        "active_alerts": active_alerts,
        "active_sources": active_sources,
    }


@router.get("/volume-timeline")
async def get_volume_timeline(days: int = 30, db: AsyncSession = Depends(get_db)):
    since = datetime.utcnow() - timedelta(days=days)
    result = await db.execute(
        text("""
            SELECT date(collected_at) as day, platform, count(*) as count
            FROM raw_posts
            WHERE collected_at >= :since
            GROUP BY date(collected_at), platform
            ORDER BY day
        """),
        {"since": since.isoformat()},
    )
    rows = result.fetchall()
    return [{"day": r.day, "platform": r.platform, "count": r.count} for r in rows]


@router.get("/platform-breakdown")
async def get_platform_breakdown(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(RawPost.platform, func.count(RawPost.id).label("count")).group_by(RawPost.platform)
    )
    return [{"platform": r.platform, "count": r.count} for r in result.fetchall()]


@router.get("/sentiment-overview")
async def get_sentiment_overview(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ProcessedPost.sentiment_label, func.count(ProcessedPost.id).label("count"))
        .where(ProcessedPost.sentiment_label.isnot(None))
        .group_by(ProcessedPost.sentiment_label)
    )
    return [{"label": r.sentiment_label, "count": r.count} for r in result.fetchall()]


@router.get("/threat-level")
async def get_threat_level(db: AsyncSession = Depends(get_db)):
    avg = (await db.execute(select(func.avg(ProcessedPost.threat_score)))).scalar() or 0
    high_count = (
        await db.execute(select(func.count(ProcessedPost.id)).where(ProcessedPost.threat_score > 0.7))
    ).scalar() or 0
    return {"average_threat_score": round(float(avg), 3), "high_threat_posts": high_count}


@router.get("/top-entities")
async def get_top_entities(limit: int = 10, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Entity).order_by(Entity.mention_count.desc()).limit(limit)
    )
    entities = result.scalars().all()
    return [
        {
            "id": str(e.id),
            "type": e.entity_type,
            "value": e.value,
            "display_name": e.display_name,
            "mention_count": e.mention_count,
            "risk_score": e.risk_score,
        }
        for e in entities
    ]


@router.get("/geo-data")
async def get_geo_data(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ProcessedPost.geo_lat, ProcessedPost.geo_lon, ProcessedPost.geo_label, func.count(ProcessedPost.id).label("count"))
        .where(ProcessedPost.geo_lat.isnot(None))
        .group_by(ProcessedPost.geo_lat, ProcessedPost.geo_lon, ProcessedPost.geo_label)
    )
    return [
        {"lat": r.geo_lat, "lon": r.geo_lon, "label": r.geo_label, "count": r.count}
        for r in result.fetchall()
    ]


@router.get("/recent-alerts")
async def get_recent_alerts(limit: int = 20, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Alert).order_by(Alert.created_at.desc()).limit(limit)
    )
    alerts = result.scalars().all()
    return [
        {
            "id": str(a.id),
            "title": a.title,
            "severity": a.severity,
            "alert_type": a.alert_type,
            "is_read": a.is_read,
            "created_at": a.created_at.isoformat(),
        }
        for a in alerts
    ]


@router.get("/trending-topics")
async def get_trending_topics(db: AsyncSession = Depends(get_db)):
    # For SQLite, topics are stored as JSON arrays — query directly
    result = await db.execute(select(ProcessedPost.topics).where(ProcessedPost.topics.isnot(None)))
    topic_counts = {}
    for row in result.fetchall():
        topics = row[0]
        if isinstance(topics, str):
            import json
            try:
                topics = json.loads(topics)
            except Exception:
                continue
        if isinstance(topics, list):
            for t in topics:
                topic_counts[t] = topic_counts.get(t, 0) + 1
    sorted_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)[:20]
    return [{"topic": t, "count": c} for t, c in sorted_topics]
