from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import init_db

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        await init_db()
        from app.seed.bootstrap import seed_users
        await seed_users()
        print(f"[STARTUP] Database initialized. URL: {settings.database_url[:30]}...")
    except Exception as e:
        print(f"[STARTUP] Database init failed (will retry on first request): {e}")
    yield
    # Shutdown


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # PoC — allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
from app.auth.router import router as auth_router
from app.dashboard.router import router as dashboard_router
from app.ingestion.router import router as ingestion_router
from app.entities.router import router as entities_router
from app.alerts.router import router as alerts_router
from app.reports.router import router as reports_router
from app.seed.router import router as seed_router

app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(ingestion_router)
app.include_router(entities_router)
app.include_router(alerts_router)
app.include_router(reports_router)
app.include_router(seed_router)


@app.get("/health")
async def health():
    return {"status": "ok", "platform": settings.app_name}
