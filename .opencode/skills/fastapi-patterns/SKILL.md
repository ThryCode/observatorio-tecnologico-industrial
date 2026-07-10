---
name: fastapi-patterns
description: FastAPI patterns and conventions for the Observatorio backend API
metadata:
  version: "1.0.0"
  category: "backend"
  tags: ["fastapi", "python", "api", "async"]
---

# FastAPI Patterns

## When To Use
- Creating new API endpoints in `backend/app/api/v1/`
- Adding or modifying service classes in `backend/app/services/`
- Working with Pydantic schemas in `backend/app/schemas/`
- Configuring FastAPI middleware or dependencies

## Workflow

### 1. Create Route
```python
# backend/app/api/v1/entity.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies import get_db, get_current_user
from app.schemas.common import PaginatedResponse
from app.schemas.entity import EntityCreate, EntityResponse
from app.services.entity_service import EntityService

router = APIRouter(prefix="/entities", tags=["Entities"])

@router.get("/", response_model=PaginatedResponse[EntityResponse])
async def list_entities(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    service = EntityService(db)
    items, total = await service.list(skip=skip, limit=limit)
    return PaginatedResponse(items=items, total=total, skip=skip, limit=limit)
```

### 2. Create Service
```python
# backend/app/services/entity_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.entity import Entity
from app.core.exceptions import AppException

class EntityService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, skip: int = 0, limit: int = 20):
        count_q = select(func.count()).select_from(Entity)
        total = (await self.db.execute(count_q)).scalar() or 0
        
        query = select(Entity).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all(), total

    async def get(self, id: str):
        query = select(Entity).where(Entity.id == id)
        result = await self.db.execute(query)
        entity = result.scalar_one_or_none()
        if not entity:
            raise AppException(status_code=404, detail="Entity not found")
        return entity
```

### 3. Create Schema
```python
# backend/app/schemas/entity.py
from pydantic import BaseModel, ConfigDict, Field

class EntityBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None

class EntityCreate(EntityBase):
    pass

class EntityResponse(EntityBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
```

### 4. Register Router
```python
# backend/app/api/v1/router.py
from app.api.v1 import entity
api_router.include_router(entity.router)
```

## Guardrails
- All routes must use `Depends(get_db)` for database sessions
- All protected routes must use `Depends(get_current_user)`
- List endpoints must return `PaginatedResponse[T]`
- Use `AppException` for all error responses
- Never use `session.query()` - always `select()`

## Anti-Patterns
- DON'T put business logic in route handlers
- DON'T use sync DB operations
- DON'T skip error handling
- DON'T hardcode values that should come from config
- DON'T create routes without response_model

## Done Checklist
- [ ] Route registered in `router.py`
- [ ] Service class follows constructor pattern
- [ ] Pydantic schema uses `from_attributes=True`
- [ ] Error handling covers not-found cases
- [ ] `ruff check backend/` passes
