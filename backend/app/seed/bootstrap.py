from sqlalchemy import select
from app.database import async_session
from app.models import User
from app.auth.service import hash_password


async def seed_users():
    """Create default admin and analyst users if they don't exist."""
    async with async_session() as db:
        result = await db.execute(select(User).where(User.username == "admin"))
        if result.scalar_one_or_none() is None:
            admin = User(
                username="admin",
                password_hash=hash_password("admin123"),
                display_name="Administrator",
                role="admin",
            )
            analyst = User(
                username="analyst",
                password_hash=hash_password("analyst123"),
                display_name="Intelligence Analyst",
                role="analyst",
            )
            viewer = User(
                username="viewer",
                password_hash=hash_password("viewer123"),
                display_name="Report Viewer",
                role="viewer",
            )
            db.add_all([admin, analyst, viewer])
            await db.commit()
            print("[SEED] Default users created: admin, analyst, viewer")
        else:
            print("[SEED] Users already exist, skipping")
