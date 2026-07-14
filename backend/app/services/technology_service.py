from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.models.technology import Technology
from app.schemas.technology import TechnologyCreate, TechnologyUpdate


class TechnologyService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, page: int, per_page: int, sector_codigo: str | None = None) -> tuple[list[Technology], int]:
        query = select(Technology)
        count_query = select(func.count(Technology.id))

        if sector_codigo:
            query = query.where(Technology.sector_codigo == sector_codigo)
            count_query = count_query.where(Technology.sector_codigo == sector_codigo)

        total = (await self.db.execute(count_query)).scalar()
        offset = (page - 1) * per_page
        result = await self.db.execute(
            query.offset(offset).limit(per_page).order_by(Technology.created_at.desc())
        )
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
