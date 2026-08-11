from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.research_publication import ResearchPublication
from app.schemas.research_publication import (
    ResearchPublicationCreate,
    ResearchPublicationUpdate,
)
from app.services.base import BaseService
from app.services.query_helpers import apply_date_range


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
        author_name: str | None = None,
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
        if author_name:
            query = query.where(
                func.lower(ResearchPublication.autores).ilike(func.lower(f"%{author_name}%"))
            )
            count_query = count_query.where(
                func.lower(ResearchPublication.autores).ilike(func.lower(f"%{author_name}%"))
            )
        if q:
            like = f"%{q}%"
            text_fields = [
                ResearchPublication.titulo,
                ResearchPublication.autores,
                ResearchPublication.resumen,
                ResearchPublication.doi,
                ResearchPublication.journal,
                ResearchPublication.sector_codigo,
            ]
            cond = func.lower(text_fields[0]).ilike(func.lower(like))
            for f in text_fields[1:]:
                cond = cond | func.lower(f).ilike(func.lower(like))
            cond = cond | func.lower(ResearchPublication.palabras_clave).ilike(func.lower(like))
            query = query.where(cond)
            count_query = count_query.where(cond)

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
