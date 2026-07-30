
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.technology import Technology
from app.schemas.technology import TechnologyCreate, TechnologyUpdate
from app.services.base import BaseService
from app.services.query_helpers import apply_search


class TechnologyService(BaseService[Technology, TechnologyCreate, TechnologyUpdate]):
    def __init__(self, db: AsyncSession):
        super().__init__(Technology, db)

    async def list(self, page: int, per_page: int, sector_codigo: str | None = None,
                   q: str | None = None, trl_nivel: int | None = None,
                   sort_by: str | None = None, sort_order: str = "desc") -> tuple[list[Technology], int]:
        query = select(Technology)
        count_query = select(func.count(Technology.id))

        if sector_codigo:
            query = query.where(Technology.sector_codigo == sector_codigo)
            count_query = count_query.where(Technology.sector_codigo == sector_codigo)
        if trl_nivel is not None:
            query = query.where(Technology.trl_nivel == trl_nivel)
            count_query = count_query.where(Technology.trl_nivel == trl_nivel)
        if q:
            search_fields = [Technology.nombre, Technology.descripcion, Technology.palabras_clave]
            query = apply_search(query, Technology, q, search_fields)
            count_query = apply_search(count_query, Technology, q, search_fields)

        allowed_sorts = {
            "nombre": Technology.nombre,
            "created_at": Technology.created_at,
            "trl_nivel": Technology.trl_nivel,
        }
        return await self._paginate(count_query, query, page, per_page, sort_by, sort_order, allowed_sorts)
