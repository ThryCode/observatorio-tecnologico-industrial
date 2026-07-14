from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.models.regulation import Regulation
from app.schemas.regulation import RegulationCreate, RegulationUpdate


class RegulationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, page: int, per_page: int, category: str | None = None) -> tuple[list[Regulation], int]:
        query = select(Regulation)
        count_query = select(func.count(Regulation.id))

        if category:
            query = query.where(Regulation.category == category)
            count_query = count_query.where(Regulation.category == category)

        total = (await self.db.execute(count_query)).scalar()
        offset = (page - 1) * per_page
        result = await self.db.execute(
            query.offset(offset).limit(per_page).order_by(Regulation.created_at.desc())
        )
        items = result.scalars().all()
        return items, total

    async def get(self, regulation_id: UUID) -> Regulation:
        result = await self.db.execute(select(Regulation).where(Regulation.id == regulation_id))
        regulation = result.scalar_one_or_none()
        if not regulation:
            raise AppException(404, "Regulation not found")
        return regulation

    async def create(self, data: RegulationCreate) -> Regulation:
        regulation = Regulation(**data.model_dump())
        self.db.add(regulation)
        await self.db.flush()
        return regulation

    async def update(self, regulation_id: UUID, data: RegulationUpdate) -> Regulation:
        regulation = await self.get(regulation_id)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(regulation, key, val)
        await self.db.flush()
        await self.db.refresh(regulation)
        return regulation

    async def delete(self, regulation_id: UUID) -> None:
        regulation = await self.get(regulation_id)
        await self.db.delete(regulation)
        await self.db.flush()
