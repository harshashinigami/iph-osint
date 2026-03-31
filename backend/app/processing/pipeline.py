"""
Lightweight NLP processing pipeline for ILA OSINT Intelligence Platform.

Processes unprocessed RawPost records and creates ProcessedPost records with:
- Sentiment analysis via VADER
- Entity extraction via regex patterns
- Language detection via langdetect
- Threat scoring via keyword matching
"""

import re
import logging
from datetime import datetime
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import RawPost, ProcessedPost, Entity, EntityPostMention, Alert, gen_uuid

logger = logging.getLogger(__name__)

# ── Threat Keywords ────────────────────────────────────────────────────────────
THREAT_KEYWORDS = [
    "bomb", "attack", "threat", "jihad", "terror", "arms", "smuggling",
    "radicalization", "infiltration", "IED", "violence", "hate speech",
    "mob", "fraud", "scam", "phishing", "malware", "hack",
]

# ── Topic Keyword Mapping ──────────────────────────────────────────────────────
TOPIC_KEYWORDS: dict[str, list[str]] = {
    "terrorism": ["terror", "jihad", "IED", "bomb", "attack", "militant", "extremism", "radicalization"],
    "cybercrime": ["hack", "phishing", "malware", "ransomware", "ddos", "exploit", "cyber", "breach"],
    "fraud": ["fraud", "scam", "ponzi", "cheat", "fake", "impersonation", "forgery"],
    "smuggling": ["smuggling", "trafficking", "contraband", "arms", "narcotics", "drug"],
    "politics": ["election", "vote", "government", "parliament", "minister", "BJP", "Congress", "AAP"],
    "finance": ["money", "bank", "loan", "crypto", "bitcoin", "ethereum", "upi", "payment"],
    "violence": ["violence", "mob", "riot", "lynching", "assault", "murder", "kill"],
    "propaganda": ["propaganda", "fake news", "disinformation", "misinformation", "deepfake"],
}

# ── Threat Category Mapping ────────────────────────────────────────────────────
THREAT_CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "terrorism": ["terror", "jihad", "IED", "bomb", "attack", "militant", "radicalization", "infiltration"],
    "fraud": ["fraud", "scam", "phishing", "ponzi", "cheat", "fake", "impersonation"],
    "cyber": ["hack", "malware", "ransomware", "ddos", "exploit", "breach"],
    "violence": ["violence", "mob", "riot", "lynching", "assault", "murder", "kill", "arms", "smuggling"],
    "propaganda": ["hate speech", "propaganda", "disinformation"],
}

# ── Known Person / Org Names for NER ──────────────────────────────────────────
KNOWN_PERSONS = [
    "Narendra Modi", "Rahul Gandhi", "Amit Shah", "Arvind Kejriwal",
    "Mamata Banerjee", "Yogi Adityanath", "Priyanka Gandhi", "Smriti Irani",
    "Rajnath Singh", "S. Jaishankar",
]

KNOWN_ORGS = [
    "BJP", "Congress", "AAP", "NDA", "UPA", "RSS", "AIMIM", "TMC",
    "CBI", "NIA", "RAW", "IB", "BSF", "CRPF", "NSG", "ATS",
    "RBI", "SEBI", "ED", "Income Tax", "NCPCR",
    "Google", "Meta", "Twitter", "WhatsApp", "Telegram",
    "ISI", "Al-Qaeda", "ISIS", "LeT", "JeM",
]

# Threat organisations that always trigger a critical alert
THREAT_ORGS = {"ISI", "Al-Qaeda", "ISIS", "LeT", "JeM"}

# ── Indian Cities with Lat/Lon ─────────────────────────────────────────────────
INDIAN_CITIES: dict[str, tuple[float, float]] = {
    "Mumbai": (19.0760, 72.8777),
    "Delhi": (28.6139, 77.2090),
    "Bangalore": (12.9716, 77.5946),
    "Bengaluru": (12.9716, 77.5946),
    "Hyderabad": (17.3850, 78.4867),
    "Chennai": (13.0827, 80.2707),
    "Kolkata": (22.5726, 88.3639),
    "Pune": (18.5204, 73.8567),
    "Ahmedabad": (23.0225, 72.5714),
    "Jaipur": (26.9124, 75.7873),
    "Lucknow": (26.8467, 80.9462),
    "Surat": (21.1702, 72.8311),
    "Patna": (25.5941, 85.1376),
    "Bhopal": (23.2599, 77.4126),
    "Chandigarh": (30.7333, 76.7794),
}

# ── Regex Patterns ─────────────────────────────────────────────────────────────
RE_PHONE = re.compile(r'\+91[\s-]?\d{10}|\b[6-9]\d{9}\b')
RE_EMAIL = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
RE_UPI = re.compile(r'[a-zA-Z0-9._-]+@(paytm|gpay|upi|ybl|okhdfcbank|okaxis|oksbi|apl|ibl)', re.IGNORECASE)
RE_BTC = re.compile(r'\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b')
RE_ETH = re.compile(r'\b0x[a-fA-F0-9]{40}\b')
RE_IP = re.compile(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b')
RE_DOMAIN = re.compile(r'\b(?:[a-zA-Z0-9-]+\.)+(?:com|org|net|in|co\.in|gov\.in|edu)\b', re.IGNORECASE)


# ── Lazy-loaded singletons ─────────────────────────────────────────────────────

_vader_analyzer = None


def _get_vader():
    global _vader_analyzer
    if _vader_analyzer is None:
        try:
            from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
            _vader_analyzer = SentimentIntensityAnalyzer()
        except ImportError:
            logger.warning("vaderSentiment not installed; sentiment will default to neutral.")
    return _vader_analyzer


# ── Helper functions ───────────────────────────────────────────────────────────

def _detect_language(text: str) -> str:
    """Detect language using langdetect; fall back to 'en' on failure."""
    try:
        from langdetect import detect
        return detect(text)
    except Exception:
        return "en"


def _analyse_sentiment(text: str) -> tuple[float, str]:
    """Return (score, label) using VADER compound score.

    Score range: -1.0 (most negative) to +1.0 (most positive).
    Labels: positive (>= 0.05), negative (<= -0.05), neutral otherwise.
    """
    analyzer = _get_vader()
    if analyzer is None:
        return 0.0, "neutral"
    scores = analyzer.polarity_scores(text)
    compound = round(scores["compound"], 4)
    if compound >= 0.05:
        label = "positive"
    elif compound <= -0.05:
        label = "negative"
    else:
        label = "neutral"
    return compound, label


def _extract_entities(text: str) -> list[dict]:
    """Extract structured entities from text using regex and keyword matching."""
    entities: list[dict] = []

    # UPI must come before email to avoid overlap (UPI is a subset of email pattern)
    for match in RE_UPI.finditer(text):
        entities.append({"type": "upi", "value": match.group()})

    for match in RE_EMAIL.finditer(text):
        val = match.group()
        # Skip if already captured as UPI
        if not any(e["value"] == val for e in entities):
            entities.append({"type": "email", "value": val})

    for match in RE_PHONE.finditer(text):
        entities.append({"type": "phone", "value": match.group()})

    for match in RE_ETH.finditer(text):
        entities.append({"type": "crypto_eth", "value": match.group()})

    for match in RE_BTC.finditer(text):
        entities.append({"type": "crypto_btc", "value": match.group()})

    for match in RE_IP.finditer(text):
        entities.append({"type": "ip", "value": match.group()})

    # Domain: exclude matches already covered by email/UPI
    email_domains = {e["value"].split("@")[-1] for e in entities if e["type"] in ("email", "upi")}
    for match in RE_DOMAIN.finditer(text):
        val = match.group()
        if val not in email_domains:
            entities.append({"type": "domain", "value": val})

    return entities


def _extract_ner(text: str) -> dict:
    """Simple keyword-based NER for persons and organisations."""
    text_lower = text.lower()
    persons = [p for p in KNOWN_PERSONS if p.lower() in text_lower]
    orgs = [o for o in KNOWN_ORGS if o.lower() in text_lower]
    return {"persons": persons, "orgs": orgs, "locations": []}


def _calculate_threat_score(text: str) -> tuple[float, list[str]]:
    """Rule-based threat scoring.

    Each matched keyword adds 0.15 to the score (capped at 1.0).
    Also returns the threat categories detected.
    """
    text_lower = text.lower()
    score = 0.0
    for kw in THREAT_KEYWORDS:
        if kw.lower() in text_lower:
            score += 0.15
    score = min(round(score, 4), 1.0)

    categories = []
    for cat, kws in THREAT_CATEGORY_KEYWORDS.items():
        if any(kw.lower() in text_lower for kw in kws):
            categories.append(cat)

    return score, categories


def _extract_topics(text: str) -> list[str]:
    """Return topics whose keywords appear in the text."""
    text_lower = text.lower()
    return [
        topic
        for topic, kws in TOPIC_KEYWORDS.items()
        if any(kw.lower() in text_lower for kw in kws)
    ]


def _detect_geo(text: str) -> tuple[Optional[float], Optional[float], Optional[str]]:
    """Return (lat, lon, label) for the first Indian city mentioned, or (None, None, None)."""
    text_lower = text.lower()
    for city, (lat, lon) in INDIAN_CITIES.items():
        if city.lower() in text_lower:
            return lat, lon, city
    return None, None, None


def _clean_content(text: str) -> str:
    """Strip excess whitespace and normalise newlines."""
    return re.sub(r'\s+', ' ', text).strip()


# ── Entity upsert helpers ──────────────────────────────────────────────────────

async def _upsert_entity(
    db: AsyncSession,
    entity_type: str,
    value: str,
    now: datetime,
) -> Entity:
    """Return existing entity (incrementing mention_count) or create a new one."""
    result = await db.execute(
        select(Entity).where(Entity.entity_type == entity_type, Entity.value == value)
    )
    entity = result.scalar_one_or_none()
    if entity:
        entity.mention_count += 1
        entity.last_seen_at = now
    else:
        entity = Entity(
            id=gen_uuid(),
            entity_type=entity_type,
            value=value,
            display_name=value,
            first_seen_at=now,
            last_seen_at=now,
            mention_count=1,
            risk_score=0.0,
        )
        db.add(entity)
        # Flush so the entity gets its id before we reference it
        await db.flush()
    return entity


# ── Main pipeline entry point ──────────────────────────────────────────────────

async def process_unprocessed(db: AsyncSession, batch_size: int = 100) -> dict:
    """Process unprocessed posts: sentiment, entities, threat scoring.

    Returns a summary dict with counts of processed posts and any errors.
    """
    processed_count = 0
    error_count = 0
    alert_count = 0
    errors: list[str] = []

    # Fetch unprocessed posts
    result = await db.execute(
        select(RawPost)
        .where(RawPost.is_processed == False)  # noqa: E712
        .limit(batch_size)
    )
    raw_posts: list[RawPost] = list(result.scalars().all())

    if not raw_posts:
        return {"processed": 0, "errors": 0, "message": "No unprocessed posts found."}

    now = datetime.utcnow()

    for raw_post in raw_posts:
        try:
            content = raw_post.content or ""
            content_clean = _clean_content(content)

            # 1. Language detection
            language = _detect_language(content_clean) if content_clean else "en"

            # 2. Sentiment
            sentiment_score, sentiment_label = _analyse_sentiment(content_clean)

            # 3. Entity extraction (regex)
            extracted_entities = _extract_entities(content_clean)

            # 4. NER (keyword-based)
            ner_results = _extract_ner(content_clean)

            # 5. Threat scoring
            threat_score, threat_categories = _calculate_threat_score(content_clean)

            # 6. Topics
            topics = _extract_topics(content_clean)

            # 7. Geo location
            geo_lat, geo_lon, geo_label = _detect_geo(content_clean)

            # Create ProcessedPost record
            processed_post = ProcessedPost(
                id=gen_uuid(),
                raw_post_id=raw_post.id,
                content_clean=content_clean,
                language=language,
                sentiment_score=sentiment_score,
                sentiment_label=sentiment_label,
                threat_score=threat_score,
                threat_categories=threat_categories,
                topics=topics,
                ner_results=ner_results,
                extracted_entities=extracted_entities,
                geo_lat=geo_lat,
                geo_lon=geo_lon,
                geo_label=geo_label,
                processed_at=now,
            )
            db.add(processed_post)
            await db.flush()  # get processed_post.id before creating mentions

            # Mark raw post as processed
            raw_post.is_processed = True

            # Upsert entities and create EntityPostMention records
            all_entity_items: list[tuple[str, str]] = [
                (e["type"], e["value"]) for e in extracted_entities
            ]
            # Also add NER persons and orgs
            for person in ner_results.get("persons", []):
                all_entity_items.append(("person", person))
            for org in ner_results.get("orgs", []):
                all_entity_items.append(("org", org))

            seen_entity_keys: set[tuple[str, str]] = set()
            for entity_type, entity_value in all_entity_items:
                key = (entity_type, entity_value)
                if key in seen_entity_keys:
                    continue
                seen_entity_keys.add(key)

                try:
                    entity = await _upsert_entity(db, entity_type, entity_value, now)
                    # Build a short context snippet
                    idx = content_clean.lower().find(entity_value.lower())
                    if idx >= 0:
                        start = max(0, idx - 40)
                        end = min(len(content_clean), idx + len(entity_value) + 40)
                        context = content_clean[start:end]
                    else:
                        context = content_clean[:80]

                    mention = EntityPostMention(
                        entity_id=entity.id,
                        post_id=processed_post.id,
                        mention_context=context[:500],
                    )
                    db.add(mention)
                except Exception as entity_err:
                    logger.warning(
                        "Failed to upsert entity %s/%s for post %s: %s",
                        entity_type, entity_value, raw_post.id, entity_err,
                    )

            # ── Alert generation ───────────────────────────────────────────
            mentioned_threat_orgs = THREAT_ORGS.intersection(set(ner_results.get("orgs", [])))
            should_alert = threat_score > 0.5 or bool(mentioned_threat_orgs)

            if should_alert:
                if mentioned_threat_orgs or threat_score > 0.7:
                    alert_severity = "critical"
                else:
                    alert_severity = "high"

                title_body = content_clean[:80]
                alert_title = f"High threat detected: {title_body}"

                alert_type = threat_categories[0] if threat_categories else "threat"

                description_parts = []
                if threat_categories:
                    description_parts.append(f"Threat categories: {', '.join(threat_categories)}")
                description_parts.append(f"Sentiment: {sentiment_label} ({sentiment_score:+.2f})")
                if mentioned_threat_orgs:
                    description_parts.append(f"Threat orgs mentioned: {', '.join(sorted(mentioned_threat_orgs))}")
                entity_summary = [e["value"] for e in extracted_entities[:5]]
                if entity_summary:
                    description_parts.append(f"Entities: {', '.join(entity_summary)}")

                alert = Alert(
                    id=gen_uuid(),
                    title=alert_title,
                    description="\n".join(description_parts),
                    severity=alert_severity,
                    alert_type=alert_type,
                    source_post_id=raw_post.id,
                    extra_data={
                        "threat_score": threat_score,
                        "threat_categories": threat_categories,
                        "sentiment_label": sentiment_label,
                        "sentiment_score": sentiment_score,
                        "threat_orgs": sorted(mentioned_threat_orgs),
                    },
                )
                db.add(alert)
                alert_count += 1

            processed_count += 1

        except Exception as e:
            error_count += 1
            error_msg = f"Post {raw_post.id}: {e}"
            errors.append(error_msg)
            logger.error("Error processing post %s: %s", raw_post.id, e, exc_info=True)

    # Commit all changes in one go
    try:
        await db.commit()
    except Exception as commit_err:
        await db.rollback()
        logger.error("Commit failed after processing batch: %s", commit_err, exc_info=True)
        return {
            "processed": 0,
            "errors": len(raw_posts),
            "message": f"Batch commit failed: {commit_err}",
        }

    return {
        "processed": processed_count,
        "alerts_created": alert_count,
        "errors": error_count,
        "total_found": len(raw_posts),
        "message": f"Processed {processed_count} posts, generated {alert_count} alerts, {error_count} errors.",
        **({"error_details": errors[:10]} if errors else {}),
    }
