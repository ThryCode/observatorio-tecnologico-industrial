from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.research_publication import ResearchPublication
from app.schemas.research_publication import (
    ResearchPublicationCreate,
    ResearchPublicationUpdate,
)
from app.services.base import BaseService
from app.services.query_helpers import apply_date_range, apply_search


class ResearchPublicationService(
    BaseService[ResearchPublication, ResearchPublicationCreate, ResearchPublicationUpdate]
):
    def __init__(self, db: AsyncSession):
        super().__init__(ResearchPublication, db)

    async def list(
        self,
        page: int,
        per_page: int,
        sector_codigo: str | None = None,
        q: str | None = None,
        fecha_desde: str | None = None,
        fecha_hasta: str | None = None,
        sort_by: str | None = None,
        sort_order: str = "desc",
    ) -> tuple[list[ResearchPublication], int]:
        query = select(ResearchPublication)
        count_query = select(func.count(ResearchPublication.id))

        if sector_codigo:
            query = query.where(
                ResearchPublication.sector_codigo == sector_codigo
            )
            count_query = count_query.where(
                ResearchPublication.sector_codigo == sector_codigo
            )
        if q:
            search_fields = [
                ResearchPublication.titulo,
                ResearchPublication.autores,
                ResearchPublication.resumen,
                ResearchPublication.palabras_clave,
            ]
            query = apply_search(query, ResearchPublication, q, search_fields)
            count_query = apply_search(
                count_query, ResearchPublication, q, search_fields
            )

        query = apply_date_range(
            query, ResearchPublication.fecha_publicacion, fecha_desde, fecha_hasta
        )
        count_query = apply_date_range(
            count_query, ResearchPublication.fecha_publicacion, fecha_desde, fecha_hasta
        )

        allowed_sorts = {
            "titulo": ResearchPublication.titulo,
            "fecha_publicacion": ResearchPublication.fecha_publicacion,
            "created_at": ResearchPublication.created_at,
        }
        return await self._paginate(
            count_query, query, page, per_page,
            sort_by, sort_order, allowed_sorts,
            default_sort=ResearchPublication.fecha_publicacion.desc(),
        )
