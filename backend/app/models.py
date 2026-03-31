import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, Float, Integer, Boolean, DateTime, ForeignKey, JSON, UniqueConstraint, Index, TypeDecorator
)
from sqlalchemy.orm import relationship
from app.database import Base


class UUIDType(TypeDecorator):
    """Platform-agnostic UUID type. Stores as String(36) for SQLite compatibility."""
    impl = String(36)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            return str(value)
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            return str(value)
        return value


def gen_uuid():
    return str(uuid.uuid4())


# ── Users ──────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(UUIDType, primary_key=True, default=gen_uuid)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(255))
    role = Column(String(20), default="analyst")  # admin, senior_analyst, analyst, viewer
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ── Sources ────────────────────────────────────────────
class Source(Base):
    __tablename__ = "sources"

    id = Column(UUIDType, primary_key=True, default=gen_uuid)
    name = Column(String(100), nullable=False)
    platform = Column(String(50), nullable=False)  # twitter, telegram, reddit, rss, gdelt, synthetic
    config = Column(JSON, default=dict)  # feed_url, channel_id, subreddit, etc.
    is_active = Column(Boolean, default=True)
    status = Column(String(20), default="idle")  # idle, running, error, disabled
    last_fetched_at = Column(DateTime)
    post_count = Column(Integer, default=0)
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


# ── Raw Posts ──────────────────────────────────────────
class RawPost(Base):
    __tablename__ = "raw_posts"

    id = Column(UUIDType, primary_key=True, default=gen_uuid)
    source_id = Column(UUIDType, ForeignKey("sources.id"))
    external_id = Column(String(255))
    platform = Column(String(50), nullable=False)
    author_name = Column(String(255))
    author_handle = Column(String(255))
    content = Column(Text, nullable=False)
    media_urls = Column(JSON, default=list)
    raw_metadata = Column(JSON, default=dict)  # likes, shares, followers, etc.
    language = Column(String(10))
    collected_at = Column(DateTime, default=datetime.utcnow)
    published_at = Column(DateTime)
    is_processed = Column(Boolean, default=False)

    __table_args__ = (
        UniqueConstraint("platform", "external_id", name="uq_platform_external_id"),
        Index("idx_raw_posts_collected", "collected_at"),
        Index("idx_raw_posts_unprocessed", "is_processed"),
    )


# ── Processed Posts ────────────────────────────────────
class ProcessedPost(Base):
    __tablename__ = "processed_posts"

    id = Column(UUIDType, primary_key=True, default=gen_uuid)
    raw_post_id = Column(UUIDType, ForeignKey("raw_posts.id"), unique=True)
    content_clean = Column(Text)
    language = Column(String(10))
    sentiment_score = Column(Float)  # -1.0 to 1.0
    sentiment_label = Column(String(20))  # positive, negative, neutral
    threat_score = Column(Float, default=0)  # 0.0 to 1.0
    threat_categories = Column(JSON, default=list)  # ["propaganda", "fraud", "cyber"]
    topics = Column(JSON, default=list)
    ner_results = Column(JSON, default=dict)  # {"persons": [], "orgs": [], "locations": []}
    extracted_entities = Column(JSON, default=list)  # [{"type": "phone", "value": "..."}, ...]
    geo_lat = Column(Float)
    geo_lon = Column(Float)
    geo_label = Column(String(255))
    processed_at = Column(DateTime, default=datetime.utcnow)

    raw_post = relationship("RawPost")

    __table_args__ = (
        Index("idx_processed_threat", "threat_score"),
        Index("idx_processed_sentiment", "sentiment_score"),
    )


# ── Entities ───────────────────────────────────────────
class Entity(Base):
    __tablename__ = "entities"

    id = Column(UUIDType, primary_key=True, default=gen_uuid)
    entity_type = Column(String(50), nullable=False)  # person, org, location, phone, email, upi, crypto, ip, domain, handle
    value = Column(String(500), nullable=False)
    display_name = Column(String(255))
    extra_data = Column(JSON, default=dict)
    first_seen_at = Column(DateTime, default=datetime.utcnow)
    last_seen_at = Column(DateTime, default=datetime.utcnow)
    mention_count = Column(Integer, default=1)
    risk_score = Column(Float, default=0)

    __table_args__ = (
        UniqueConstraint("entity_type", "value", name="uq_entity_type_value"),
        Index("idx_entities_type", "entity_type"),
        Index("idx_entities_risk", "risk_score"),
    )


# ── Entity Relations (Graph Edges) ─────────────────────
class EntityRelation(Base):
    __tablename__ = "entity_relations"

    id = Column(UUIDType, primary_key=True, default=gen_uuid)
    source_entity_id = Column(UUIDType, ForeignKey("entities.id"), nullable=False)
    target_entity_id = Column(UUIDType, ForeignKey("entities.id"), nullable=False)
    relation_type = Column(String(50), nullable=False)  # co_mentioned, communicates_with, affiliated, financial_link, same_as
    weight = Column(Float, default=1.0)
    evidence_post_ids = Column(JSON, default=list)
    first_seen_at = Column(DateTime, default=datetime.utcnow)
    last_seen_at = Column(DateTime, default=datetime.utcnow)

    source_entity = relationship("Entity", foreign_keys=[source_entity_id])
    target_entity = relationship("Entity", foreign_keys=[target_entity_id])

    __table_args__ = (
        UniqueConstraint("source_entity_id", "target_entity_id", "relation_type", name="uq_relation"),
        Index("idx_relations_source", "source_entity_id"),
        Index("idx_relations_target", "target_entity_id"),
    )


# ── Entity-Post Mentions ──────────────────────────────
class EntityPostMention(Base):
    __tablename__ = "entity_post_mentions"

    entity_id = Column(UUIDType, ForeignKey("entities.id"), primary_key=True)
    post_id = Column(UUIDType, ForeignKey("processed_posts.id"), primary_key=True)
    mention_context = Column(String(500))


# ── Keywords ───────────────────────────────────────────
class Keyword(Base):
    __tablename__ = "keywords"

    id = Column(UUIDType, primary_key=True, default=gen_uuid)
    keyword = Column(String(255), nullable=False)
    category = Column(String(100))  # political, fraud, cyber, extremism, financial
    is_active = Column(Boolean, default=True)
    match_count = Column(Integer, default=0)
    created_by = Column(UUIDType, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)


# ── Alerts ─────────────────────────────────────────────
class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUIDType, primary_key=True, default=gen_uuid)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    severity = Column(String(20), nullable=False)  # critical, high, medium, low, info
    alert_type = Column(String(50), nullable=False)  # spike, threat, entity, keyword, anomaly, fraud, coordination
    source_post_id = Column(UUIDType, ForeignKey("raw_posts.id"))
    source_entity_id = Column(UUIDType, ForeignKey("entities.id"))
    extra_data = Column(JSON, default=dict)
    is_read = Column(Boolean, default=False)
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(UUIDType, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_alerts_severity", "severity"),
        Index("idx_alerts_created", "created_at"),
    )


# ── Alert Rules ────────────────────────────────────────
class AlertRule(Base):
    __tablename__ = "alert_rules"

    id = Column(UUIDType, primary_key=True, default=gen_uuid)
    name = Column(String(255), nullable=False)
    rule_type = Column(String(50), nullable=False)  # keyword_match, sentiment_threshold, volume_spike, entity_risk
    config = Column(JSON, nullable=False)  # {"keyword": "...", "threshold": 0.8}
    severity = Column(String(20), default="medium")
    is_active = Column(Boolean, default=True)
    created_by = Column(UUIDType, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)


# ── Reports ────────────────────────────────────────────
class Report(Base):
    __tablename__ = "reports"

    id = Column(UUIDType, primary_key=True, default=gen_uuid)
    title = Column(String(500), nullable=False)
    report_type = Column(String(50), nullable=False)  # sitrep, weekly, custom
    parameters = Column(JSON, default=dict)
    content = Column(JSON, default=dict)
    file_path = Column(String(500))
    file_format = Column(String(10))  # pdf, docx, xlsx
    generated_by = Column(UUIDType, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
