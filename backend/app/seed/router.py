from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db

router = APIRouter(prefix="/api/v1/seed", tags=["seed"])


@router.post("/run")
async def run_seed(db: AsyncSession = Depends(get_db)):
    from app.seed.generator import generate_all
    counts = await generate_all(db)
    return {"status": "seeded", "counts": counts}


@router.post("/reset")
async def reset_seed(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    tables = [
        "entity_post_mentions", "entity_relations", "alerts", "alert_rules",
        "processed_posts", "raw_posts", "entities", "keywords", "reports", "sources"
    ]
    for table in tables:
        await db.execute(text(f"DELETE FROM {table}"))
    await db.commit()
    from app.seed.generator import generate_all
    counts = await generate_all(db)
    return {"status": "reset_and_seeded", "counts": counts}
