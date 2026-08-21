import json
from contextlib import asynccontextmanager
from pathlib import Path

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.v1.router import api_router
from app.core import db
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging_config import setup_logging
from app.core.middleware import RequestIDMiddleware
from app.limiter import limiter

logger = structlog.stdlib.get_logger()

origins = json.loads(settings.backend_cors_origins)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info("starting_api", component="startup")

    await db.startup_db()

    neo4j = None
    redis_client = None

    try:
        from app.neo4j_client import create_neo4j_driver
        neo4j = create_neo4j_driver(settings)
        logger.info("neo4j_driver_created", component="startup")
    except Exception:
        logger.warning("neo4j_unavailable", component="startup")

    try:
        from app.redis_client import create_redis_client
        redis_client = create_redis_client(settings)
        await redis_client.ping()
        logger.info("redis_client_created")
    except Exception:
        redis_client = None
        logger.warning("redis_unavailable", reason="caching_disabled")

    app.state.neo4j = neo4j
    app.state.redis = redis_client

    if neo4j:
        try:
            async with db._session_factory() as session:
                from app.graph.repository import GraphRepository
                repo = GraphRepository(neo4j)
                result = await repo.sync_enterprise_graph(session)
                logger.info("neo4j_enterprise_sync", result=str(result))
        except Exception as e:
            logger.warning("neo4j_enterprise_sync_failed", error=str(e))

    logger.info("application_startup_complete")

    # Background summary email scheduler (only if SMTP is configured)
    summary_task = None
    if settings.smtp_host:
        import asyncio

        from app.services.notification_service import summary_scheduler_loop

        stop_event = asyncio.Event()
        summary_task = asyncio.create_task(summary_scheduler_loop(stop_event))

    yield

    if summary_task:
        stop_event.set()
        summary_task.cancel()
        try:
            await summary_task
        except asyncio.CancelledError:
            logger.info("summary_scheduler_cancelled")

    logger.info("shutting_down_api")
    await db.close_db()
    if neo4j:
        try:  # noqa: SIM105
            await neo4j.close()
            logger.info("neo4j_connection_closed")
        except Exception:
            pass
    if redis_client:
        try:  # noqa: SIM105
            await redis_client.aclose()
            logger.info("redis_connection_closed")
        except Exception:
            pass


app = FastAPI(
    title="Observatorio Tecnológico Industrial API",
    description="API del Observatorio Tecnológico Industrial para el MINDUS (Ministerio de Industrias). "
    "Monitorea tendencias globales en ciencia, tecnología e innovación para sectores industriales cubanos.",
    version="0.5.0",
    lifespan=lifespan,
)
app.state.limiter = limiter

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)
app.add_middleware(RequestIDMiddleware)

app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

register_exception_handlers(app)
app.include_router(api_router)

uploads_path = Path(settings.upload_dir)
uploads_path.mkdir(parents=True, exist_ok=True)
