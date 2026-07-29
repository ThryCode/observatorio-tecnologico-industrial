from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.models.industrial_sector import IndustrialSector
from app.schemas.industrial_sector import IndustrialSectorCreate, IndustrialSectorUpdate
from app.services.query_helpers import apply_search, apply_sorting


class IndustrialSectorService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, page: int, per_page: int, q: str | None = None,
                   sort_by: str | None = None, sort_order: str = "desc") -> tuple[list[IndustrialSector], int]:
        query = select(IndustrialSector)
        count_query = select(func.count(IndustrialSector.codigo))

        if q:
            fields = [IndustrialSector.nombre, IndustrialSector.codigo]
            query = apply_search(query, IndustrialSector, q, fields)
            count_query = apply_search(count_query, IndustrialSector, q, fields)

        total = (await self.db.execute(count_query)).scalar()
        offset = (page - 1) * per_page

        allowed_sorts = {"nombre": IndustrialSector.nombre, "codigo": IndustrialSector.codigo}
        query = apply_sorting(query, IndustrialSector, sort_by, sort_order, allowed_sorts)
        if not sort_by:
            query = query.order_by(IndustrialSector.codigo)

        result = await self.db.execute(
            query.offset(offset).limit(per_page)
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
