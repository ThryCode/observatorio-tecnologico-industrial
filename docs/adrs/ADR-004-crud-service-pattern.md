# ADR-004: Generic CRUD Service Pattern

## Status

Accepted

## Context

The backend needs consistent CRUD operations across 9 entity types (Technology, Organization, Patent, Regulation, Indicator, IndustrialSector, Alert, Bulletin, ResearchPublication).

Each entity has:
- Similar create/update/delete patterns
- Different Pydantic schemas for input/output
- Pagination requirements
- Soft delete vs hard delete considerations

## Decision

Implement a generic `BaseService[M, C, U]` pattern with:
- `M`: SQLAlchemy model type
- `C`: Create schema type
- `U`: Update schema type

```python
class BaseService(Generic[M, C, U]):
    def __init__(self, model: type[M], db: AsyncSession, pk_field: str = "id"):
        self.model = model
        self.db = db
        self.pk_field = pk_field

    async def get(self, id: UUID | str) -> M
    async def create(self, data: C) -> M
    async def update(self, id: UUID | str, data: U) -> M
    async def delete(self, id: UUID | str) -> None
    async def _paginate(self, ...) -> tuple[list[M], int]
```

## Consequences

### Positive
- Consistent API patterns across all entities
- Reduced code duplication
- Easy to add new entities
- Pagination logic centralized

### Negative
- Less flexibility for entity-specific logic
- May need to override for complex cases

## Implementation

```python
class TechnologyService(BaseService[Technology, TechnologyCreate, TechnologyUpdate]):
    def __init__(self, db: AsyncSession):
        super().__init__(Technology, db)
```

## Related

- `backend/app/services/base.py` - BaseService
- `backend/app/services/technology_service.py` - Example
- `backend/app/services/patent_service.py` - Example with audit
