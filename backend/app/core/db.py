from collections.abc import AsyncGenerator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
    AsyncEngine,
)

from app.core.config import settings
from app.core.security import get_password_hash
from app.models.base import Base
from app.models.user import User

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


async def init_db():
    global _engine, _session_factory

    _engine = create_async_engine(
        settings.database_url,
        echo=False,
        pool_size=5,
        max_overflow=10,
    )
    _session_factory = async_sessionmaker(
        _engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await _seed_superuser()


async def _seed_superuser():
    async with _session_factory() as session:
        result = await session.execute(
            select(User).where(User.username == settings.first_superuser)
        )
        if result.scalar_one_or_none():
            return

        user = User(
            username=settings.first_superuser,
            email=f"{settings.first_superuser}@mindus.gob.cu",
            hashed_password=get_password_hash(settings.first_superuser_password),
            full_name="Super Admin",
            is_superuser=True,
        )
        session.add(user)
        await session.commit()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    if _session_factory is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")

    async with _session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def close_db():
    global _engine, _session_factory
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _session_factory = None
