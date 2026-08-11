import json
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.db import close_db, startup_db, _session_factory
from app.core.exceptions import register_exception_handlers
from app.core.logging_config import setup_logging
from app.core.middleware import RequestIDMiddleware
from app.limiter import limiter

origins = json.loads(settings.backend_cors_origins)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.bind(component="startup").info("Starting Observatorio Tecnologico Industrial API")

    await startup_db()

    neo4j = None
    redis_client = None

    try:
        from app.neo4j_client import create_neo4j_driver
        neo4j = create_neo4j_driver(settings)
        logger.bind(component="startup").info("Neo4j driver created")
    except Exception:
        logger.bind(component="startup").warning("Neo4j not available, graph features disabled")

    try:
        from app.redis_client import create_redis_client
        redis_client = create_redis_client(settings)
        await redis_client.ping()
        logger.info("Redis client created")
    except Exception:
        redis_client = None
        logger.warning("Redis not available, caching disabled")

    app.state.neo4j = neo4j
    app.state.redis = redis_client

    if neo4j:
        try:
            async with _session_factory() as session:
                from app.graph.repository import GraphRepository
                repo = GraphRepository(neo4j)
                result = await repo.sync_enterprise_graph(session)
                logger.info(f"Neo4j enterprise sync: {result}")

                if result.get("relationships_merged", 0) == 0:
                    from sqlalchemy import select
                    from app.models.organization import Organization
                    orgs = (await session.execute(select(Organization))).scalars().all()
                    if len(orgs) >= 2:
                        org_ids = [str(o.id) for o in orgs[:5]]
                        async with neo4j.session() as neo_session:
                            for i in range(len(org_ids) - 1):
                                await neo_session.run(
                                    "MATCH (a:Enterprise {id: $src}), (b:Enterprise {id: $tgt}) MERGE (a)-[:FOLLOWS]->(b)",
                                    src=org_ids[i], tgt=org_ids[i + 1]
                                )
                            logger.info(f"Created {len(org_ids)-1} sample FOLLOWS relationships")
        except Exception as e:
            logger.warning(f"Neo4j enterprise sync failed: {e}")

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
