"""
Telegram Bot Collector — ingests messages from channels/groups where the bot is an admin.

Uses the Telegram Bot API directly via httpx (no extra dependency needed).
The bot can only read messages from channels/groups where it has been added as an admin.

State (last_update_id) is persisted in the Source.config JSON so we don't
re-import the same updates across restarts.
"""

import httpx
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import RawPost, Source
from app.config import get_settings

TELEGRAM_API_BASE = "https://api.telegram.org/bot{token}"

# A single logical "source" record is used to represent the bot collector.
# Individual chat/channel info is stored per-post in raw_metadata.
BOT_SOURCE_NAME = "Telegram Bot"
BOT_PLATFORM = "telegram"


def _api_url(token: str, method: str) -> str:
    return f"https://api.telegram.org/bot{token}/{method}"


def _parse_message_text(message: dict) -> str:
    """Extract the best text content from a Telegram message object."""
    return (
        message.get("text")
        or message.get("caption")
        or message.get("poll", {}).get("question")
        or ""
    ).strip()


def _chat_title(chat: dict) -> str:
    """Return a human-readable name for a chat."""
    return (
        chat.get("title")
        or chat.get("username")
        or chat.get("first_name", "")
    ).strip()


async def collect_telegram(db: AsyncSession) -> dict:
    """Fetch messages from Telegram via Bot API (getUpdates).

    Returns {"new_posts": N, "errors": []}.
    """
    settings = get_settings()
    token = settings.telegram_bot_token.strip() if settings.telegram_bot_token else ""

    if not token:
        return {"new_posts": 0, "errors": ["No bot token configured"]}

    errors: list[str] = []
    total_new = 0

    # ── Find or create the bot Source record ──────────────────────────────
    result = await db.execute(
        select(Source).where(Source.name == BOT_SOURCE_NAME, Source.platform == BOT_PLATFORM)
    )
    source = result.scalar_one_or_none()
    if not source:
        source = Source(
            name=BOT_SOURCE_NAME,
            platform=BOT_PLATFORM,
            config={"last_update_id": 0},
            is_active=True,
            status="idle",
            post_count=0,
        )
        db.add(source)
        await db.flush()

    # ── Retrieve last processed update_id from source config ─────────────
    config: dict = source.config or {}
    last_update_id: int = int(config.get("last_update_id", 0))

    # ── Call getUpdates ───────────────────────────────────────────────────
    params: dict = {
        "limit": 100,          # max allowed by Telegram
        "timeout": 0,          # non-blocking (long-poll disabled)
        "allowed_updates": ["message", "channel_post"],
    }
    if last_update_id > 0:
        # offset = last_update_id + 1 tells Telegram to ACK all previous updates
        params["offset"] = last_update_id + 1

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(_api_url(token, "getUpdates"), params=params)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError as exc:
        msg = f"Telegram API HTTP error: {exc.response.status_code} {exc.response.text[:200]}"
        errors.append(msg)
        source.error_message = msg
        source.status = "error"
        await db.commit()
        return {"new_posts": 0, "errors": errors}
    except Exception as exc:
        msg = f"Telegram API request failed: {str(exc)[:200]}"
        errors.append(msg)
        source.error_message = msg
        source.status = "error"
        await db.commit()
        return {"new_posts": 0, "errors": errors}

    if not data.get("ok"):
        msg = f"Telegram API returned ok=false: {data.get('description', 'unknown error')}"
        errors.append(msg)
        source.error_message = msg
        source.status = "error"
        await db.commit()
        return {"new_posts": 0, "errors": errors}

    updates: list[dict] = data.get("result", [])
    if not updates:
        source.last_fetched_at = datetime.utcnow()
        source.status = "idle"
        await db.commit()
        return {"new_posts": 0, "errors": []}

    # ── Process each update ───────────────────────────────────────────────
    highest_update_id = last_update_id

    for update in updates:
        update_id: int = update["update_id"]
        if update_id > highest_update_id:
            highest_update_id = update_id

        # Telegram sends regular messages as "message", channel posts as "channel_post"
        message: dict | None = update.get("message") or update.get("channel_post")
        if not message:
            # e.g. edited_message, poll, etc. — skip for now
            continue

        text = _parse_message_text(message)
        if not text:
            # Skip media-only messages with no caption
            continue

        chat: dict = message.get("chat", {})
        from_user: dict = message.get("from") or {}

        # external_id is the unique Telegram message identifier: chat_id + message_id
        chat_id = str(chat.get("id", ""))
        message_id = str(message.get("message_id", ""))
        ext_id = f"{chat_id}:{message_id}"

        # Dedup check
        existing = await db.execute(
            select(RawPost).where(
                RawPost.platform == BOT_PLATFORM,
                RawPost.external_id == ext_id,
            )
        )
        if existing.scalar_one_or_none():
            continue

        # Parse timestamp
        published_at: datetime | None = None
        ts = message.get("date")
        if ts:
            try:
                published_at = datetime.utcfromtimestamp(ts)
            except Exception:
                pass

        # Author details — bots in channels won't have a "from" user
        author_name = (
            from_user.get("first_name", "")
            + (" " + from_user.get("last_name", "") if from_user.get("last_name") else "")
        ).strip() or _chat_title(chat) or "Unknown"
        author_handle = from_user.get("username") or chat.get("username") or chat_id

        # Collect photo / document URLs (file_id only — full URLs need getFile)
        media_urls: list[str] = []
        if message.get("photo"):
            # largest photo variant is last in the array
            largest = message["photo"][-1]
            media_urls.append(f"tg://file/{largest['file_id']}")
        if message.get("document"):
            media_urls.append(f"tg://file/{message['document']['file_id']}")

        post = RawPost(
            source_id=source.id,
            external_id=ext_id,
            platform=BOT_PLATFORM,
            author_name=author_name,
            author_handle=str(author_handle),
            content=text,
            media_urls=media_urls,
            raw_metadata={
                "update_id": update_id,
                "message_id": int(message_id) if message_id.isdigit() else message_id,
                "chat_id": chat_id,
                "chat_title": _chat_title(chat),
                "chat_type": chat.get("type", ""),
                "from_user_id": str(from_user.get("id", "")),
                "forward_from_chat": (message.get("forward_from_chat") or {}).get("title", ""),
                "reply_to_message_id": (message.get("reply_to_message") or {}).get("message_id"),
            },
            language=None,  # language detection handled downstream
            collected_at=datetime.utcnow(),
            published_at=published_at,
            is_processed=False,
        )
        db.add(post)
        total_new += 1
        source.post_count = (source.post_count or 0) + 1

    # ── Persist state ─────────────────────────────────────────────────────
    if highest_update_id > last_update_id:
        updated_config = dict(config)
        updated_config["last_update_id"] = highest_update_id
        source.config = updated_config

    source.last_fetched_at = datetime.utcnow()
    source.status = "idle"
    source.error_message = None

    await db.commit()
    return {"new_posts": total_new, "errors": errors}
