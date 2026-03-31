# Telegram + Render + MCP Decisions

**Date:** 2026-03-31

## Telegram Architecture Decision
- Use **Telegram Bot API** (not user account/Telethon)
- Bot token is the only credential needed — not tied to anyone's phone
- Anyone can interact with the bot, no personal auth shared
- Bot created via @BotFather → gets a token like `7123456789:AAH...`
- Token stored as env var on server
- Multiple people can use/demo without sharing personal credentials
- Harsha won't be in the ILA meeting — others will demo

## MCP Servers
- Disabled at project level: fal-ai, gemini, stitch, excalidraw
- Kept active: openrouter (for Perplexity/Gemini web search)
- Change is project-local only (.claude/settings.local.json)

## Repo Structure: Monorepo
- Single repo: harshashinigami/iph-osint
- Two folders: backend/ (FastAPI) and frontend/ (React)
- Render deploys from subdirectories of same repo
- NOT dual repos

## Render.com Setup
- Manual web UI setup (not CLI)
- Backend: Web Service, Python, from backend/ subdirectory
- Frontend: Static Site, from frontend/ subdirectory
- Database: PostgreSQL free tier (256MB, 90-day)
- Harsha doing Steps 1-4 now, Step 5 after frontend is built

## Harsha Context
- Won't be in the ILA CEO meeting personally
- Others (likely Prithvi) will demo the platform
- Therefore: no personal credentials in the system
- Bot-based approach is critical for handoff
