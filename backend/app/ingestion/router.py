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
    """Trigger RSS feed collection from all configured Indian news portals, then run NLP."""
    from app.ingestion.collectors.rss import collect_rss
    from app.processing.pipeline import process_unprocessed
    collection_result = await collect_rss(db)
    nlp_result = await process_unprocessed(db)
    return {"collection": collection_result, "processing": nlp_result}


@router.post("/collect/telegram")
async def collect_telegram_feed(db: AsyncSession = Depends(get_db)):
    """Fetch messages from Telegram channels/groups via Bot API, then run NLP."""
    from app.ingestion.collectors.telegram_bot import collect_telegram
    from app.processing.pipeline import process_unprocessed
    collection_result = await collect_telegram(db)
    nlp_result = await process_unprocessed(db)
    return {"collection": collection_result, "processing": nlp_result}


@router.post("/process")
async def process_posts(db: AsyncSession = Depends(get_db)):
    """Run NLP processing on unprocessed posts."""
    from app.processing.pipeline import process_unprocessed
    result = await process_unprocessed(db)
    return result


@router.get("/posts")
async def list_posts(
    platform: str = None,
    search: str = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    query = select(RawPost).order_by(RawPost.collected_at.desc())
    if platform:
        query = query.where(RawPost.platform == platform)
    if search:
        query = query.where(RawPost.content.ilike(f"%{search}%"))
    query = query.limit(limit).offset(offset)
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
