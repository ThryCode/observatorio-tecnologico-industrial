# ADR-002: Async-First Backend Architecture

## Status

Accepted

## Context

The Observatorio backend needs to handle:
1. Multiple concurrent API requests
2. Database queries (SQLite, Neo4j)
3. External API calls (future integrations)
4. WebSocket connections for real-time updates

## Decision

Use async/await throughout the backend stack:
- FastAPI with async route handlers
- SQLAlchemy 2.0 with aiosqlite driver
- Neo4j async driver
- Redis async client

All database operations use `select()` (never `session.query()`).

## Consequences

### Positive
- Better performance under load (non-blocking I/O)
- Consistent async pattern across all layers
- Future-proof for scaling
- Native support in FastAPI

### Negative
- Steeper learning curve for developers unfamiliar with async
- Some libraries may not have async support
- Testing requires async test runner (pytest-asyncio)

## Implementation

```python
# Correct pattern
async def get_items(db: AsyncSession):
    result = await db.execute(select(Item))
    return result.scalars().all()

# Wrong pattern (never use)
def get_items(db: Session):
    return db.query(Item).all()
```

## Related

- `backend/app/core/db.py` - Async SQLAlchemy setup
- `backend/app/dependencies.py` - Async session dependency
- `backend/app/graph/repository.py` - Neo4j async driver
