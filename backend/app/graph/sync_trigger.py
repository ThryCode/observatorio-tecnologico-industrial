"""Background graph sync trigger.

Provides a debounced sync mechanism that batches multiple mutations
into a single Neo4j sync operation.
"""

import asyncio

import structlog
from fastapi import BackgroundTasks

logger = structlog.stdlib.get_logger()

_sync_task: asyncio.Task | None = None
_pending = False


async def _run_sync() -> None:
    """Execute graph sync in background."""
    global _pending
    try:
        from neo4j import AsyncGraphDatabase

        from app.core.config import settings
        from app.core.db import _session_factory

        if _session_factory is None:
            logger.warning("graph_sync_skipped", reason="database_not_initialized")
            return

        driver = AsyncGraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_user, settings.neo4j_password),
        )

        try:
            from app.graph.repository import GraphRepository

            repo = GraphRepository(driver)
            async with _session_factory() as session:
                result = await repo.sync_all(session)
                await session.commit()
                logger.info("auto_graph_sync", result=str(result))
        except Exception as e:
            logger.error("graph_sync_failed", error=str(e))
        finally:
            await driver.close()
    finally:
        _pending = False


def schedule_graph_sync(background_tasks: BackgroundTasks) -> None:
    """Schedule a graph sync to run after the response is sent.

    Uses FastAPI BackgroundTasks so the sync happens after the HTTP
    response, keeping API latency unaffected.

    Multiple calls within the same request are deduplicated.
    """
    global _pending

    if _pending:
        return

    _pending = True
    background_tasks.add_task(_run_sync)
