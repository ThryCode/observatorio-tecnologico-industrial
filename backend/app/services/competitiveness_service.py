from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.models.competitiveness import CompetitivenessIndex
from app.schemas.competitiveness import CompetitivenessCreate, CompetitivenessUpdate


class CompetitivenessService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(
        self, page: int, per_page: int, sector_codigo: str | None = None, periodo: str | None = None
    ) -> tuple[list[CompetitivenessIndex], int]:
        query = select(CompetitivenessIndex)
        count_query = select(func.count(CompetitivenessIndex.id))

        if sector_codigo:
            query = query.where(CompetitivenessIndex.sector_codigo == sector_codigo)
            count_query = count_query.where(CompetitivenessIndex.sector_codigo == sector_codigo)
        if periodo:
            query = query.where(CompetitivenessIndex.periodo == periodo)
            count_query = count_query.where(CompetitivenessIndex.periodo == periodo)

        total = (await self.db.execute(count_query)).scalar()
        offset = (page - 1) * per_page
        result = await self.db.execute(
            query.offset(offset).limit(per_page).order_by(CompetitivenessIndex.periodo.desc())
        )
        return result.scalars().all(), total

    async def get(self, index_id: UUID) -> CompetitivenessIndex:
        result = await self.db.execute(select(CompetitivenessIndex).where(CompetitivenessIndex.id == index_id))
        index = result.scalar_one_or_none()
        if not index:
            raise AppException(404, "Competitiveness index not found")
        return index

    async def create(self, data: CompetitivenessCreate) -> CompetitivenessIndex:
        index = CompetitivenessIndex(**data.model_dump())
        self.db.add(index)
        await self.db.flush()
        return index

    async def update(self, index_id: UUID, data: CompetitivenessUpdate) -> CompetitivenessIndex:
        index = await self.get(index_id)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(index, key, val)
        await self.db.flush()
        await self.db.refresh(index)
        return index

    async def delete(self, index_id: UUID) -> None:
        index = await self.get(index_id)
        await self.db.delete(index)
        await self.db.flush()
