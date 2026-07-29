from datetime import date
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.models.bulletin import Bulletin
from app.schemas.bulletin import BulletinCreate, BulletinUpdate
from app.services.query_helpers import apply_date_range, apply_search, apply_sorting


class BulletinService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(
        self, page: int, per_page: int, sector_codigo: str | None = None,
        categoria: str | None = None, q: str | None = None,
        fecha_desde: date | None = None, fecha_hasta: date | None = None,
        sort_by: str | None = None, sort_order: str = "desc",
    ) -> tuple[list[Bulletin], int]:
        query = select(Bulletin)
        count_query = select(func.count(Bulletin.id))

        if sector_codigo:
            query = query.where(Bulletin.sector_codigo == sector_codigo)
            count_query = count_query.where(Bulletin.sector_codigo == sector_codigo)
        if categoria:
            query = query.where(Bulletin.categoria == categoria)
            count_query = count_query.where(Bulletin.categoria == categoria)

        query = apply_search(query, Bulletin, q, [Bulletin.titulo, Bulletin.resumen])
        count_query = apply_search(count_query, Bulletin, q, [Bulletin.titulo, Bulletin.resumen])
        query = apply_date_range(query, Bulletin.fecha_publicacion, fecha_desde, fecha_hasta)
        count_query = apply_date_range(count_query, Bulletin.fecha_publicacion, fecha_desde, fecha_hasta)

        total = (await self.db.execute(count_query)).scalar()
        offset = (page - 1) * per_page
        allowed_sorts = {
            "fecha_publicacion": Bulletin.fecha_publicacion,
            "titulo": Bulletin.titulo,
            "created_at": Bulletin.created_at,
            "categoria": Bulletin.categoria,
        }
        query = apply_sorting(query, Bulletin, sort_by, sort_order, allowed_sorts)
        result = await self.db.execute(
            query.offset(offset).limit(per_page)
        )
        return result.scalars().all(), total

    async def get(self, bulletin_id: UUID) -> Bulletin:
        result = await self.db.execute(select(Bulletin).where(Bulletin.id == bulletin_id))
        bulletin = result.scalar_one_or_none()
        if not bulletin:
            raise AppException(404, "Bulletin not found")
        return bulletin

    async def create(self, data: BulletinCreate) -> Bulletin:
        bulletin = Bulletin(**data.model_dump())
        self.db.add(bulletin)
        await self.db.flush()
        return bulletin

    async def update(self, bulletin_id: UUID, data: BulletinUpdate) -> Bulletin:
        bulletin = await self.get(bulletin_id)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(bulletin, key, val)
        await self.db.flush()
        await self.db.refresh(bulletin)
        return bulletin

    async def delete(self, bulletin_id: UUID) -> None:
        bulletin = await self.get(bulletin_id)
        await self.db.delete(bulletin)
        await self.db.flush()
