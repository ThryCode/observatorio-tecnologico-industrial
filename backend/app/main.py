import json
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.db import close_db, init_db
from app.core.exceptions import register_exception_handlers

origins = json.loads(settings.backend_cors_origins)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()

    neo4j = None
    redis_client = None

    try:
        from app.neo4j_client import create_neo4j_driver
        neo4j = create_neo4j_driver(settings)
    except Exception:
        pass

    try:
        from app.redis_client import create_redis_client
        redis_client = create_redis_client(settings)
    except Exception:
        pass

    app.state.neo4j = neo4j
    app.state.redis = redis_client

    yield

    await close_db()
    if neo4j:
        try:
            await neo4j.close()
        except Exception:
            pass
    if redis_client:
        try:
            await redis_client.aclose()
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
