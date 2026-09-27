import logging
from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_settings

logger = logging.getLogger("niva.api")
settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    echo=settings.db_echo,
    pool_pre_ping=True,
    future=True,
)

async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db_session() -> AsyncGenerator[AsyncSession | None, None]:
    """Yield a real session when PostgreSQL is available; otherwise fall back to in-memory demo mode."""
    try:
        async with engine.begin() as connection:
            await connection.execute(text("SELECT 1"))
    except Exception:
        logger.warning("PostgreSQL unavailable; using in-memory demo auth storage.")
        yield None
        return

    async with async_session_factory() as session:
        yield session
