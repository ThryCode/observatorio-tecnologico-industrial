from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.regulation import Regulation
from app.schemas.regulation import RegulationCreate, RegulationUpdate
from app.services.base import BaseService
from app.services.query_helpers import apply_date_range, apply_search


class RegulationService(BaseService[Regulation, RegulationCreate, RegulationUpdate]):
    def __init__(self, db: AsyncSession):
        super().__init__(Regulation, db)

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

        allowed_sorts = {
            "title": Regulation.title,
            "publication_date": Regulation.publication_date,
            "created_at": Regulation.created_at,
            "category": Regulation.category,
        }
        return await self._paginate(count_query, query, page, per_page, sort_by, sort_order, allowed_sorts)
