from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "ILA OSINT Intelligence Platform"
    environment: str = "development"
    debug: bool = True

    # Database (SQLite for local dev, PostgreSQL on Render)
    database_url: str = "sqlite+aiosqlite:///./iph.db"

    # Auth
    jwt_secret: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiry_minutes: int = 480  # 8 hours

    # Redis (optional for PoC)
    redis_url: str = "redis://localhost:6379/0"

    # Telegram Bot
    telegram_bot_token: str = ""

    # CORS
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Demo mode
    demo_mode: bool = True

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
