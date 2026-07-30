from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.competitiveness import CompetitivenessIndex
from app.schemas.competitiveness import CompetitivenessCreate, CompetitivenessUpdate
from app.services.base import BaseService
from app.services.query_helpers import apply_search


class CompetitivenessService(BaseService[CompetitivenessIndex, CompetitivenessCreate, CompetitivenessUpdate]):
    def __init__(self, db: AsyncSession):
        super().__init__(CompetitivenessIndex, db)

    async def list(
        self, page: int, per_page: int, sector_codigo: str | None = None,
        periodo: str | None = None, q: str | None = None,
        sort_by: str | None = None, sort_order: str = "desc",
    ) -> tuple[list[CompetitivenessIndex], int]:
        query = select(CompetitivenessIndex)
        count_query = select(func.count(CompetitivenessIndex.id))

        if sector_codigo:
            query = query.where(CompetitivenessIndex.sector_codigo == sector_codigo)
            count_query = count_query.where(CompetitivenessIndex.sector_codigo == sector_codigo)
        if periodo:
            query = query.where(CompetitivenessIndex.periodo == periodo)
            count_query = count_query.where(CompetitivenessIndex.periodo == periodo)

        search_fields = [CompetitivenessIndex.indicador, CompetitivenessIndex.sector]
        query = apply_search(query, CompetitivenessIndex, q, search_fields)
        count_query = apply_search(count_query, CompetitivenessIndex, q, search_fields)

        allowed_sorts = {
            "periodo": CompetitivenessIndex.periodo,
            "indicador": CompetitivenessIndex.indicador,
            "pais": CompetitivenessIndex.pais,
            "created_at": CompetitivenessIndex.created_at,
        }
        return await self._paginate(count_query, query, page, per_page, sort_by, sort_order, allowed_sorts)
