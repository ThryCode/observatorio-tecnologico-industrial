"""Seed superuser from env vars. Idempotent - safe to run multiple times."""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.core.init_db import init_db
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine


async def main():
    engine = create_async_engine(settings.database_url, echo=False)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        await init_db(session)
        await session.commit()
    await engine.dispose()
    print("OK: superuser verified/created")


if __name__ == "__main__":
    asyncio.run(main())
