# Backend Agent Instructions

## Overview
FastAPI backend with async SQLAlchemy, Pydantic v2, and Neo4j graph layer.

## Key Files
- `app/main.py` - FastAPI app with lifespan, CORS, exception handlers
- `app/core/config.py` - Pydantic BaseSettings from .env
- `app/core/db.py` - Async SQLAlchemy engine + session factory
- `app/core/security.py` - JWT (python-jose) + bcrypt (passlib)
- `app/dependencies.py` - FastAPI DI: get_db, get_current_user, require_role
- `app/api/v1/router.py` - Central router registering all sub-routers
- `app/graph/repository.py` - Neo4j Cypher queries via APOC

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
