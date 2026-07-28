from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.models.patent_map import PatentMapEntry
from app.schemas.patent_map import PatentMapCreate, PatentMapUpdate


class PatentMapService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def summary(
        self, pais: str | None = None, sector_codigo: str | None = None
    ) -> list[PatentMapEntry]:
        query = select(PatentMapEntry)
        if pais:
            query = query.where(PatentMapEntry.pais == pais)
        if sector_codigo:
            query = query.where(PatentMapEntry.sector_codigo == sector_codigo)
        query = query.order_by(PatentMapEntry.total_patentes.desc())
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get(self, entry_id: UUID) -> PatentMapEntry:
        result = await self.db.execute(select(PatentMapEntry).where(PatentMapEntry.id == entry_id))
        entry = result.scalar_one_or_none()
        if not entry:
            raise AppException(404, "Patent map entry not found")
        return entry

    async def create(self, data: PatentMapCreate) -> PatentMapEntry:
        entry = PatentMapEntry(**data.model_dump())
        self.db.add(entry)
        await self.db.flush()
        return entry

    async def update(self, entry_id: UUID, data: PatentMapUpdate) -> PatentMapEntry:
        entry = await self.get(entry_id)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(entry, key, val)
        await self.db.flush()
        await self.db.refresh(entry)
        return entry

    async def delete(self, entry_id: UUID) -> None:
        entry = await self.get(entry_id)
        await self.db.delete(entry)
        await self.db.flush()
