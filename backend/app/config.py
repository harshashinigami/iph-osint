from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path


class Settings(BaseSettings):
    # App
    app_name: str = "ILA OSINT Intelligence Platform"
    environment: str = "development"
    debug: bool = False

    # Database (SQLite for local dev, PostgreSQL on Render)
    database_url: str = "sqlite+aiosqlite:///./iph.db"

    # Auth
    jwt_secret: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiry_minutes: int = 480

    # Telegram Bot
    telegram_bot_token: str = ""

    # Demo mode
    demo_mode: bool = True

    model_config = {
        "env_file": ".env" if Path(".env").exists() else None,
        "env_file_encoding": "utf-8",
    }


@lru_cache
def get_settings() -> Settings:
    return Settings()
