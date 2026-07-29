from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.models.technology import Technology
from app.schemas.technology import TechnologyCreate, TechnologyUpdate
from app.services.query_helpers import apply_search, apply_sorting


class TechnologyService:
    def __init__(self, db: AsyncSession):
        self.db = db

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

        total = (await self.db.execute(count_query)).scalar()
        offset = (page - 1) * per_page

        allowed_sorts = {
            "nombre": Technology.nombre,
            "created_at": Technology.created_at,
            "trl_nivel": Technology.trl_nivel,
        }
        if sort_by:
            query = apply_sorting(query, Technology, sort_by, sort_order, allowed_sorts)
        else:
            query = query.order_by(Technology.created_at.desc())

        result = await self.db.execute(query.offset(offset).limit(per_page))
        items = result.scalars().all()
        return items, total

    async def get(self, tech_id: UUID) -> Technology:
        result = await self.db.execute(select(Technology).where(Technology.id == tech_id))
        tech = result.scalar_one_or_none()
        if not tech:
            raise AppException(404, "Technology not found")
        return tech

    async def create(self, data: TechnologyCreate) -> Technology:
        tech = Technology(**data.model_dump())
        self.db.add(tech)
        await self.db.flush()
        return tech

    async def update(self, tech_id: UUID, data: TechnologyUpdate) -> Technology:
        tech = await self.get(tech_id)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(tech, key, val)
        await self.db.flush()
        await self.db.refresh(tech)
        return tech

    async def delete(self, tech_id: UUID) -> None:
        tech = await self.get(tech_id)
        await self.db.delete(tech)
        await self.db.flush()
