from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db

router = APIRouter(prefix="/api/v1/seed", tags=["seed"])


@router.post("/run")
async def run_seed(db: AsyncSession = Depends(get_db)):
    from app.seed.generator import generate_all
    counts = await generate_all(db)
    return {"status": "seeded", "counts": counts}


@router.post("/full-setup")
async def full_setup(db: AsyncSession = Depends(get_db)):
    """Seed the database and then run the NLP pipeline on all unprocessed posts.

    Convenience endpoint for demo/deploy: one call to populate everything.
    """
    from app.seed.generator import generate_all
    from app.processing.pipeline import process_unprocessed

    # Step 1: Seed posts, entities, relations, alerts
    seed_counts = await generate_all(db)

    # Step 2: Process all unprocessed posts in batches of 200
    nlp_totals: dict = {"processed": 0, "errors": 0, "alerts_created": 0}
    while True:
        batch_result = await process_unprocessed(db, batch_size=200)
        batch_processed = batch_result.get("processed", 0)
        nlp_totals["processed"] += batch_processed
        nlp_totals["errors"] += batch_result.get("errors", 0)
        nlp_totals["alerts_created"] += batch_result.get("alerts_created", 0)
        if batch_processed == 0:
            break

    return {
        "status": "full_setup_complete",
        "seed": seed_counts,
        "nlp": nlp_totals,
    }


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
