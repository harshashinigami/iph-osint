from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from app.database import get_db
from app.models import Entity, EntityRelation, EntityPostMention, ProcessedPost, RawPost

router = APIRouter(prefix="/api/v1/entities", tags=["entities"])


@router.get("")
async def list_entities(
    entity_type: str = None, limit: int = 50, offset: int = 0,
    q: str = None, db: AsyncSession = Depends(get_db)
):
    query = select(Entity).order_by(Entity.mention_count.desc()).limit(limit).offset(offset)
    if entity_type:
        query = query.where(Entity.entity_type == entity_type)
    if q:
        query = query.where(Entity.value.ilike(f"%{q}%"))
    result = await db.execute(query)
    entities = result.scalars().all()
    return [
        {
            "id": str(e.id),
            "entity_type": e.entity_type,
            "value": e.value,
            "display_name": e.display_name,
            "mention_count": e.mention_count,
            "risk_score": e.risk_score,
            "first_seen_at": e.first_seen_at.isoformat(),
            "last_seen_at": e.last_seen_at.isoformat(),
        }
        for e in entities
    ]


@router.get("/stats")
async def get_entity_stats(db: AsyncSession = Depends(get_db)):
    """Return aggregate statistics for the entity graph."""
    # Total counts
    total_entities = (await db.execute(select(func.count()).select_from(Entity))).scalar_one()
    total_relations = (await db.execute(select(func.count()).select_from(EntityRelation))).scalar_one()

    # Counts broken down by entity type
    type_rows = (
        await db.execute(
            select(Entity.entity_type, func.count().label("cnt"))
            .group_by(Entity.entity_type)
            .order_by(func.count().desc())
        )
    ).fetchall()
    by_type = {row.entity_type: row.cnt for row in type_rows}

    # Top 5 highest risk_score entities
    top_risk_result = await db.execute(
        select(Entity).order_by(Entity.risk_score.desc()).limit(5)
    )
    top_risk = [
        {
            "id": str(e.id),
            "entity_type": e.entity_type,
            "value": e.value,
            "display_name": e.display_name,
            "risk_score": e.risk_score,
            "mention_count": e.mention_count,
        }
        for e in top_risk_result.scalars().all()
    ]

    return {
        "total_entities": total_entities,
        "total_relations": total_relations,
        "by_type": by_type,
        "top_risk_entities": top_risk,
    }


@router.get("/{entity_id}")
async def get_entity(entity_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Entity).where(Entity.id == entity_id))
    e = result.scalar_one_or_none()
    if not e:
        return {"error": "Entity not found"}
    # Get related posts
    mentions = await db.execute(
        select(EntityPostMention, ProcessedPost, RawPost)
        .join(ProcessedPost, EntityPostMention.post_id == ProcessedPost.id)
        .join(RawPost, ProcessedPost.raw_post_id == RawPost.id)
        .where(EntityPostMention.entity_id == entity_id)
        .limit(20)
    )
    posts = [
        {
            "post_id": str(m.ProcessedPost.id),
            "content": m.RawPost.content[:200],
            "platform": m.RawPost.platform,
            "sentiment": m.ProcessedPost.sentiment_label,
            "context": m.EntityPostMention.mention_context,
        }
        for m in mentions.fetchall()
    ]
    return {
        "id": str(e.id),
        "entity_type": e.entity_type,
        "value": e.value,
        "display_name": e.display_name,
        "metadata": e.extra_data,
        "mention_count": e.mention_count,
        "risk_score": e.risk_score,
        "first_seen_at": e.first_seen_at.isoformat(),
        "last_seen_at": e.last_seen_at.isoformat(),
        "posts": posts,
    }


@router.get("/graph/data")
async def get_graph_data(
    entity_type: str = None, min_connections: int = 1, limit: int = 500,
    db: AsyncSession = Depends(get_db)
):
    # Get entities with enough connections
    entity_query = select(Entity).where(Entity.mention_count >= min_connections).limit(limit)
    if entity_type:
        entity_query = entity_query.where(Entity.entity_type == entity_type)
    result = await db.execute(entity_query)
    entities = result.scalars().all()
    entity_ids = {str(e.id) for e in entities}

    nodes = [
        {
            "id": str(e.id),
            "label": e.display_name or e.value,
            "type": e.entity_type,
            "risk_score": e.risk_score,
            "mention_count": e.mention_count,
        }
        for e in entities
    ]

    # Get relations between these entities
    if entity_ids:
        rel_result = await db.execute(
            select(EntityRelation).where(
                EntityRelation.source_entity_id.in_([e.id for e in entities])
            )
        )
        relations = rel_result.scalars().all()
        edges = [
            {
                "from": str(r.source_entity_id),
                "to": str(r.target_entity_id),
                "type": r.relation_type,
                "weight": r.weight,
            }
            for r in relations
            if str(r.target_entity_id) in entity_ids
        ]
    else:
        edges = []

    return {"nodes": nodes, "edges": edges}


@router.get("/graph/shortest-path")
async def shortest_path(source_id: str, target_id: str, max_hops: int = 5, db: AsyncSession = Depends(get_db)):
    """BFS shortest path using Python (works with any DB backend)."""
    import networkx as nx

    # Load graph edges into NetworkX
    result = await db.execute(select(EntityRelation.source_entity_id, EntityRelation.target_entity_id))
    G = nx.Graph()
    for row in result.fetchall():
        G.add_edge(str(row[0]), str(row[1]))

    try:
        path = nx.shortest_path(G, source=source_id, target=target_id)
        if len(path) - 1 > max_hops:
            return {"path": [], "depth": -1}
        return {"path": path, "depth": len(path) - 1}
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        return {"path": [], "depth": -1}
