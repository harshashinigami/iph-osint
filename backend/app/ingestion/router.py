from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models import Source, RawPost

router = APIRouter(prefix="/api/v1/ingestion", tags=["ingestion"])


@router.get("/sources")
async def list_sources(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Source).order_by(Source.name))
    sources = result.scalars().all()
    return [
        {
            "id": str(s.id),
            "name": s.name,
            "platform": s.platform,
            "is_active": s.is_active,
            "status": s.status,
            "last_fetched_at": s.last_fetched_at.isoformat() if s.last_fetched_at else None,
            "post_count": s.post_count,
            "error_message": s.error_message,
        }
        for s in sources
    ]


@router.post("/sources")
async def create_source(data: dict, db: AsyncSession = Depends(get_db)):
    source = Source(
        name=data["name"],
        platform=data["platform"],
        config=data.get("config", {}),
        is_active=data.get("is_active", True),
    )
    db.add(source)
    await db.commit()
    return {"id": str(source.id), "name": source.name}


@router.patch("/sources/{source_id}")
async def toggle_source(source_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Source).where(Source.id == source_id))
    source = result.scalar_one_or_none()
    if not source:
        return {"error": "Source not found"}
    if "is_active" in data:
        source.is_active = data["is_active"]
    await db.commit()
    return {"id": str(source.id), "is_active": source.is_active}


@router.post("/collect/rss")
async def collect_rss_feeds(db: AsyncSession = Depends(get_db)):
    """Trigger RSS feed collection from all configured Indian news portals."""
    from app.ingestion.collectors.rss import collect_rss
    result = await collect_rss(db)
    return result


@router.post("/collect/telegram")
async def collect_telegram_feed(db: AsyncSession = Depends(get_db)):
    """Fetch messages from Telegram channels/groups via Bot API."""
    from app.ingestion.collectors.telegram_bot import collect_telegram
    result = await collect_telegram(db)
    return result


@router.get("/posts")
async def list_posts(platform: str = None, limit: int = 50, offset: int = 0, db: AsyncSession = Depends(get_db)):
    query = select(RawPost).order_by(RawPost.collected_at.desc()).limit(limit).offset(offset)
    if platform:
        query = query.where(RawPost.platform == platform)
    result = await db.execute(query)
    posts = result.scalars().all()
    return [
        {
            "id": str(p.id),
            "platform": p.platform,
            "author_name": p.author_name,
            "content": p.content[:300],
            "language": p.language,
            "collected_at": p.collected_at.isoformat(),
            "is_processed": p.is_processed,
        }
        for p in posts
    ]
