from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.models.industrial_sector import IndustrialSector
from app.schemas.industrial_sector import IndustrialSectorCreate, IndustrialSectorUpdate


class IndustrialSectorService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, page: int, per_page: int) -> tuple[list[IndustrialSector], int]:
        count_query = select(func.count(IndustrialSector.codigo))
        total = (await self.db.execute(count_query)).scalar()
        offset = (page - 1) * per_page
        result = await self.db.execute(
            select(IndustrialSector).offset(offset).limit(per_page).order_by(IndustrialSector.codigo)
        )
        items = result.scalars().all()
        return items, total

    async def get(self, codigo: str) -> IndustrialSector:
        result = await self.db.execute(
            select(IndustrialSector).where(IndustrialSector.codigo == codigo)
        )
        sector = result.scalar_one_or_none()
        if not sector:
            raise AppException(404, "Industrial sector not found")
        return sector

    async def create(self, data: IndustrialSectorCreate) -> IndustrialSector:
        existing = await self.db.execute(
            select(IndustrialSector).where(IndustrialSector.codigo == data.codigo)
        )
        if existing.scalar_one_or_none():
            raise AppException(409, f"Sector with code {data.codigo} already exists")
        sector = IndustrialSector(**data.model_dump())
        self.db.add(sector)
        await self.db.flush()
        return sector

    async def update(self, codigo: str, data: IndustrialSectorUpdate) -> IndustrialSector:
        sector = await self.get(codigo)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(sector, key, val)
        await self.db.flush()
        await self.db.refresh(sector)
        return sector

    async def delete(self, codigo: str) -> None:
        sector = await self.get(codigo)
        await self.db.delete(sector)
        await self.db.flush()
