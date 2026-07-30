from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.bulletin import Bulletin
from app.schemas.bulletin import BulletinCreate, BulletinUpdate
from app.services.base import BaseService
from app.services.query_helpers import apply_date_range, apply_search


class BulletinService(BaseService[Bulletin, BulletinCreate, BulletinUpdate]):
    def __init__(self, db: AsyncSession):
        super().__init__(Bulletin, db)

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

        allowed_sorts = {
            "fecha_publicacion": Bulletin.fecha_publicacion,
            "titulo": Bulletin.titulo,
            "created_at": Bulletin.created_at,
            "categoria": Bulletin.categoria,
        }
        return await self._paginate(count_query, query, page, per_page, sort_by, sort_order, allowed_sorts)
