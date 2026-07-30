from typing import Generic, TypeVar
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException

M = TypeVar("M")
C = TypeVar("C")
U = TypeVar("U")


class BaseService(Generic[M, C, U]):
    def __init__(self, model: type[M], db: AsyncSession, pk_field: str = "id"):
        self.model = model
        self.db = db
        self.pk_field = pk_field

    async def get(self, id: UUID | str) -> M:
        pk = getattr(self.model, self.pk_field)
        result = await self.db.execute(select(self.model).where(pk == id))
        obj = result.scalar_one_or_none()
        if not obj:
            raise AppException(404, f"{self.model.__name__} not found")
        return obj

    async def create(self, data: C) -> M:
        obj = self.model(**data.model_dump())
        self.db.add(obj)
        await self.db.flush()
        return obj

    async def update(self, id: UUID | str, data: U) -> M:
        obj = await self.get(id)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(obj, key, val)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def delete(self, id: UUID | str) -> None:
        obj = await self.get(id)
        await self.db.delete(obj)
        await self.db.flush()

    def _build_list_query(self):
        return select(self.model), select(func.count(self.model.id))

    async def _paginate(self, count_query, list_query,
                         page: int, per_page: int,
                         sort_by=None, sort_order="desc",
                         allowed_sorts=None, default_sort=None):
        total = (await self.db.execute(count_query)).scalar()
        offset = (page - 1) * per_page
        if sort_by and allowed_sorts:
            from app.services.query_helpers import apply_sorting
            list_query = apply_sorting(list_query, self.model, sort_by, sort_order, allowed_sorts)
        elif default_sort:
            list_query = list_query.order_by(default_sort)
        else:
            list_query = list_query.order_by(self.model.created_at.desc())
        result = await self.db.execute(list_query.offset(offset).limit(per_page))
        items = result.scalars().all()
        return items, total
