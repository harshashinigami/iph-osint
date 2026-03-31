"""
RSS News Feed Collector — ingests articles from Indian news portals.
"""
import feedparser
import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import RawPost, Source

# Indian news RSS feeds (all free, no API key needed)
DEFAULT_FEEDS = [
    {"name": "NDTV - Top Stories", "url": "https://feeds.feedburner.com/ndtvnews-top-stories"},
    {"name": "The Hindu", "url": "https://www.thehindu.com/feeder/default.rss"},
    {"name": "Times of India", "url": "https://timesofindia.indiatimes.com/rssfeedstopstories.cms"},
    {"name": "India Today", "url": "https://www.indiatoday.in/rss/home"},
    {"name": "Hindustan Times", "url": "https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml"},
    {"name": "Economic Times", "url": "https://economictimes.indiatimes.com/rssfeedstopstories.cms"},
    {"name": "NDTV - India", "url": "https://feeds.feedburner.com/ndtvnews-india-news"},
    {"name": "BBC India", "url": "http://feeds.bbci.co.uk/news/world/asia/india/rss.xml"},
]


async def collect_rss(db: AsyncSession, max_per_feed: int = 20) -> dict:
    """Fetch articles from all configured RSS feeds."""
    total_new = 0
    total_skipped = 0
    errors = []

    for feed_config in DEFAULT_FEEDS:
        try:
            feed = feedparser.parse(feed_config["url"])
            if not feed.entries:
                errors.append(f"{feed_config['name']}: No entries")
                continue

            # Find or create source
            result = await db.execute(
                select(Source).where(Source.name == feed_config["name"], Source.platform == "rss")
            )
            source = result.scalar_one_or_none()
            if not source:
                source = Source(name=feed_config["name"], platform="rss", config={"feed_url": feed_config["url"]}, is_active=True, status="idle", post_count=0)
                db.add(source)
                await db.flush()

            for entry in feed.entries[:max_per_feed]:
                ext_id = entry.get("id") or entry.get("link") or entry.get("title", "")[:100]
                # Check if already exists
                existing = await db.execute(
                    select(RawPost).where(RawPost.platform == "rss", RawPost.external_id == ext_id)
                )
                if existing.scalar_one_or_none():
                    total_skipped += 1
                    continue

                # Parse publish date
                published = None
                if hasattr(entry, "published_parsed") and entry.published_parsed:
                    try:
                        published = datetime(*entry.published_parsed[:6])
                    except Exception:
                        pass

                content = entry.get("summary") or entry.get("description") or entry.get("title", "")
                # Strip HTML tags (basic)
                import re
                content = re.sub(r'<[^>]+>', '', content).strip()

                post = RawPost(
                    source_id=source.id,
                    external_id=ext_id,
                    platform="rss",
                    author_name=entry.get("author", feed_config["name"]),
                    author_handle=feed_config["name"],
                    content=content,
                    media_urls=[],
                    raw_metadata={
                        "title": entry.get("title", ""),
                        "link": entry.get("link", ""),
                        "tags": [t.get("term", "") for t in entry.get("tags", [])],
                    },
                    language="en",
                    collected_at=datetime.utcnow(),
                    published_at=published,
                    is_processed=False,
                )
                db.add(post)
                total_new += 1
                source.post_count = (source.post_count or 0) + 1

            source.last_fetched_at = datetime.utcnow()
            source.status = "idle"
            await db.flush()

        except Exception as e:
            errors.append(f"{feed_config['name']}: {str(e)[:100]}")

    await db.commit()
    return {"new_posts": total_new, "skipped": total_skipped, "errors": errors}
