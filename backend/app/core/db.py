import sys
from collections.abc import AsyncGenerator
from pathlib import Path

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from app.core.config import settings

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


async def _run_alembic_migrations() -> None:
    import subprocess

    import structlog

    logger = structlog.stdlib.get_logger()

    backend_dir = str(Path(__file__).resolve().parent.parent.parent)
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=backend_dir,
        capture_output=True,
    )
    if result.returncode != 0:
        logger.error("alembic_migration_failed", stderr=result.stderr.decode())
        raise RuntimeError(f"Alembic migration failed: {result.stderr.decode()}")
    logger.info("alembic_migrations_applied")


async def startup_db() -> None:
    global _engine, _session_factory

    use_sqlite = "sqlite" in settings.database_url
    engine_kwargs: dict = {"echo": False}
    if use_sqlite:
        engine_kwargs["connect_args"] = {"check_same_thread": False}
        engine_kwargs["poolclass"] = NullPool
    else:
        engine_kwargs["connect_args"] = {"ssl": False}
        engine_kwargs["pool_size"] = 5
        engine_kwargs["max_overflow"] = 10

    _engine = create_async_engine(settings.database_url, **engine_kwargs)
    _session_factory = async_sessionmaker(
        _engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    await _run_alembic_migrations()

    async with _session_factory() as session:
        from app.core.init_db import init_db as seed_db
        try:
            await seed_db(session)
            await session.commit()
        except Exception:
            await session.rollback()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    if _session_factory is None:
        raise RuntimeError("Database not initialized. Call startup_db() first.")

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
