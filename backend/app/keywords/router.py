from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.database import get_db
from app.models import Keyword

router = APIRouter(prefix="/api/v1/keywords", tags=["keywords"])


@router.get("")
async def list_keywords(category: str = None, db: AsyncSession = Depends(get_db)):
    query = select(Keyword).order_by(Keyword.match_count.desc())
    if category:
        query = query.where(Keyword.category == category)
    result = await db.execute(query)
    keywords = result.scalars().all()
    return [
        {
            "id": str(k.id),
            "keyword": k.keyword,
            "category": k.category,
            "is_active": k.is_active,
            "match_count": k.match_count,
        }
        for k in keywords
    ]


@router.post("")
async def create_keyword(data: dict, db: AsyncSession = Depends(get_db)):
    kw = Keyword(
        keyword=data["keyword"],
        category=data.get("category", "general"),
        is_active=True,
        match_count=0,
    )
    db.add(kw)
    await db.commit()
    return {"id": str(kw.id), "keyword": kw.keyword}


@router.delete("/{keyword_id}")
async def delete_keyword(keyword_id: str, db: AsyncSession = Depends(get_db)):
    await db.execute(delete(Keyword).where(Keyword.id == keyword_id))
    await db.commit()
    return {"deleted": keyword_id}
