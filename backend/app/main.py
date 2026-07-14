import json
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.db import close_db, init_db
from app.core.exceptions import register_exception_handlers
from app.core.logging_config import setup_logging

origins = json.loads(settings.backend_cors_origins)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info("Starting Observatorio Tecnológico Industrial API")

    await init_db()

    neo4j = None
    redis_client = None

    try:
        from app.neo4j_client import create_neo4j_driver
        neo4j = create_neo4j_driver(settings)
        logger.info("Neo4j driver created")
    except Exception:
        logger.warning("Neo4j not available, graph features disabled")

    try:
        from app.redis_client import create_redis_client
        redis_client = create_redis_client(settings)
        logger.info("Redis client created")
    except Exception:
        logger.warning("Redis not available, caching disabled")

    app.state.neo4j = neo4j
    app.state.redis = redis_client

    logger.info("Application startup complete")

    yield

    logger.info("Shutting down Observatorio API")
    await close_db()
    if neo4j:
        try:  # noqa: SIM105
            await neo4j.close()
            logger.info("Neo4j connection closed")
        except Exception:
            pass
    if redis_client:
        try:  # noqa: SIM105
            await redis_client.aclose()
            logger.info("Redis connection closed")
        except Exception:
            pass


app = FastAPI(
    title="Observatorio Tecnológico Industrial API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

register_exception_handlers(app)
app.include_router(api_router)
