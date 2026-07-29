from datetime import date
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.models.regulation import Regulation
from app.schemas.regulation import RegulationCreate, RegulationUpdate
from app.services.query_helpers import apply_date_range, apply_search, apply_sorting


class RegulationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(
        self, page: int, per_page: int, category: str | None = None,
        q: str | None = None, sector_codigo: str | None = None,
        fecha_desde: date | None = None, fecha_hasta: date | None = None,
        sort_by: str | None = None, sort_order: str = "desc",
    ) -> tuple[list[Regulation], int]:
        query = select(Regulation)
        count_query = select(func.count(Regulation.id))

        if category:
            query = query.where(Regulation.category == category)
            count_query = count_query.where(Regulation.category == category)
        if sector_codigo:
            query = query.where(Regulation.sector_codigo == sector_codigo)
            count_query = count_query.where(Regulation.sector_codigo == sector_codigo)

        query = apply_search(query, Regulation, q, [Regulation.title, Regulation.regulation_number])
        count_query = apply_search(count_query, Regulation, q, [Regulation.title, Regulation.regulation_number])
        query = apply_date_range(query, Regulation.publication_date, fecha_desde, fecha_hasta)
        count_query = apply_date_range(count_query, Regulation.publication_date, fecha_desde, fecha_hasta)

        total = (await self.db.execute(count_query)).scalar()
        offset = (page - 1) * per_page
        allowed_sorts = {
            "title": Regulation.title,
            "publication_date": Regulation.publication_date,
            "created_at": Regulation.created_at,
            "category": Regulation.category,
        }
        query = apply_sorting(query, Regulation, sort_by, sort_order, allowed_sorts)
        result = await self.db.execute(
            query.offset(offset).limit(per_page)
        )
        items = result.scalars().all()
        return items, total

    async def get(self, regulation_id: UUID) -> Regulation:
        result = await self.db.execute(select(Regulation).where(Regulation.id == regulation_id))
        regulation = result.scalar_one_or_none()
        if not regulation:
            raise AppException(404, "Regulation not found")
        return regulation

    async def create(self, data: RegulationCreate) -> Regulation:
        regulation = Regulation(**data.model_dump())
        self.db.add(regulation)
        await self.db.flush()
        return regulation

    async def update(self, regulation_id: UUID, data: RegulationUpdate) -> Regulation:
        regulation = await self.get(regulation_id)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(regulation, key, val)
        await self.db.flush()
        await self.db.refresh(regulation)
        return regulation

    async def delete(self, regulation_id: UUID) -> None:
        regulation = await self.get(regulation_id)
        await self.db.delete(regulation)
        await self.db.flush()
