from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.patent_map import PatentMapEntry
from app.schemas.patent_map import PatentMapCreate, PatentMapUpdate
from app.services.base import BaseService


class PatentMapService(BaseService[PatentMapEntry, PatentMapCreate, PatentMapUpdate]):
    def __init__(self, db: AsyncSession):
        super().__init__(PatentMapEntry, db)

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
