from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import create_engine, create_session_factory
from app.neo4j_client import create_neo4j_driver
from app.redis_client import create_redis_client
from app.core.exceptions import register_exception_handlers
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    engine = create_engine(settings.database_url)
    session_factory = create_session_factory(engine)
    neo4j = create_neo4j_driver(settings)
    redis_client = create_redis_client(settings)

    app.state.engine = engine
    app.state.session_factory = session_factory
    app.state.neo4j = neo4j
    app.state.redis = redis_client

    yield

    await engine.dispose()
    await neo4j.close()
    await redis_client.aclose()


app = FastAPI(
    title="Observatorio Tecnológico Industrial API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)
app.include_router(api_router)
