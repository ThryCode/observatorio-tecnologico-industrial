# Backend Agent Instructions

## Overview
FastAPI backend with async SQLAlchemy, Pydantic v2, and Neo4j graph layer.

## Key Files
- `app/main.py` - FastAPI app with lifespan, CORS, exception handlers
- `app/core/config.py` - Pydantic BaseSettings from .env
- `app/core/db.py` - Async SQLAlchemy engine + session factory
- `app/core/security.py` - JWT (python-jose) + bcrypt (passlib)
- `app/core/logging_config.py` - Loguru setup (stdout + rotating file)
- `app/core/exceptions.py` - AppException + IntegrityError->409 handler
- `app/dependencies.py` - FastAPI DI: get_db, get_current_user, require_role
- `app/api/v1/router.py` - Central router registering all sub-routers
- `app/graph/repository.py` - Neo4j Cypher queries via APOC
- `app/services/cache.py` - Redis caching (get/set/invalidate/cache_key)
- `app/redis_client.py` - Redis client factory
- `app/neo4j_client.py` - Neo4j driver factory

## FastAPI Patterns
- Use `lifespan` context manager for startup/shutdown (not deprecated `on_event`)
- All routes under `/api/v1/` prefix via `api_router`
- Dependencies: `Depends(get_db)` for sessions, `Depends(get_current_user)` for auth
- Custom errors: `raise AppException(status_code=404, detail="Not found")`
- Response model: always use `response_model=PaginatedResponse[T]` for lists

## SQLAlchemy Async
- Engine: `create_async_engine` with `asyncpg` driver
- Session: `AsyncSession` with `expire_on_commit=False`
- Queries: use `select()`, `await session.execute()`, `.scalars().all()`
- Pagination: `offset/limit` with `func.count()` for total
- Never use sync sessions or `session.query()`

## Pydantic v2
- Use `model_config = SettingsConfigDict(env_file=...)` for settings
- Field validators: `@field_validator("field", mode="before")`
- Schema inheritance: `class ResponseSchema(BaseModel):` with `model_config = ConfigDict(from_attributes=True)`
- Always import from `pydantic`, not `pydantic.v1`

## Alembic Migrations
- Create: `alembic revision --autogenerate -m "description"`
- Apply: `alembic upgrade head`
- Rollback: `alembic downgrade -1`
- NEVER edit a committed migration file
- Always include reversible operations

## Neo4j Cypher
- Repository pattern: `graph/repository.py`
- Use APOC procedures: `CALL apoc.*`
- Parameterized queries: `MATCH (n {id: $id}) RETURN n`
- Driver obtained via `get_neo4j()` dependency
- Handle connection errors gracefully (graph is optional)

## Testing
- Framework: pytest + pytest-asyncio (auto mode)
- DB URL: `postgresql+asyncpg://observatorio:observatorio_dev@localhost:5432/observatorio_test`
- Fixtures: `engine` (session), `db_session` (per-test rollback), `client` (AsyncClient)
- Pattern: create tables once per session, rollback per test
- Graph tests: accept 503 if Neo4j unavailable

## Error Handling
- Custom exception: `AppException(status_code, detail)`
- Global handler in `main.py` catches `AppException`
- Validation errors return 422 with Pydantic details
- Auth errors return 401 with "Could not validate credentials"
- `IntegrityError` (unique constraint) -> 409 Conflict

## Redis Caching
- Wrapper: `app/services/cache.py` (get/set/invalidate/cache_key)
- Pattern: services accept optional `redis` param, skip caching if None
- Key format: `entity:list:{hash}` for lists, `entity:{id}` for singles
- Invalidate on mutation: `await cache.invalidate_pattern("entity:*")`
- Dependencies: `get_redis()` in `app/dependencies.py`

## Logging (loguru)
- Setup: `app/core/logging_config.py` — stdout + `logs/observatorio.log` (10MB rotation, 30 days)
- Usage: `from loguru import logger; logger.info("message")`
- Wired in `main.py` lifespan (startup + shutdown)
- `init_db.py` also uses loguru for seed info

## CI Notes
- Workflow: `.github/workflows/ci.yml` (ubuntu-latest, Python 3.11, Node 20)
- Use `python3` (not `python`) in CI commands
- Don't use `--timeout` flag in pytest (pytest-timeout not installed)
- PostgreSQL service container with `observatorio_test` DB
- Env vars needed: DATABASE_URL, NEO4J_PASSWORD, SECRET_KEY, FIRST_SUPERUSER_PASSWORD
