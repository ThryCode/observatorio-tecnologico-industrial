from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.models.research_publication import ResearchPublication
from app.schemas.research_publication import (
    ResearchPublicationCreate,
    ResearchPublicationUpdate,
)
from app.services.query_helpers import apply_date_range, apply_search, apply_sorting


class ResearchPublicationService:
    def __init__(self, db: AsyncSession):
        self.db = db

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

        total = (await self.db.execute(count_query)).scalar()
        offset = (page - 1) * per_page

        allowed_sorts = {
            "titulo": ResearchPublication.titulo,
            "fecha_publicacion": ResearchPublication.fecha_publicacion,
            "created_at": ResearchPublication.created_at,
        }
        if sort_by:
            query = apply_sorting(
                query, ResearchPublication, sort_by, sort_order, allowed_sorts
            )
        else:
            query = query.order_by(
                ResearchPublication.fecha_publicacion.desc()
            )

        result = await self.db.execute(
            query.offset(offset).limit(per_page)
        )
        items = result.scalars().all()
        return items, total

    async def get(self, pub_id: UUID) -> ResearchPublication:
        result = await self.db.execute(
            select(ResearchPublication).where(
                ResearchPublication.id == pub_id
            )
        )
        pub = result.scalar_one_or_none()
        if not pub:
            raise AppException(404, "Research publication not found")
        return pub

    async def create(self, data: ResearchPublicationCreate) -> ResearchPublication:
        pub = ResearchPublication(**data.model_dump())
        self.db.add(pub)
        await self.db.flush()
        return pub

    async def update(
        self, pub_id: UUID, data: ResearchPublicationUpdate
    ) -> ResearchPublication:
        pub = await self.get(pub_id)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(pub, key, val)
        await self.db.flush()
        await self.db.refresh(pub)
        return pub

    async def delete(self, pub_id: UUID) -> None:
        pub = await self.get(pub_id)
        await self.db.delete(pub)
        await self.db.flush()
