from uuid import UUID
from decimal import Decimal

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.indicator import Indicator
from app.schemas.indicator import IndicatorCreate, IndicatorUpdate
from app.core.exceptions import AppException


class IndicatorService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, page: int, per_page: int, sector: str | None = None,
                   period: str | None = None):
        query = select(Indicator)
        count_query = select(func.count(Indicator.id))

        if sector:
            query = query.where(Indicator.sector_codigo == sector)
            count_query = count_query.where(Indicator.sector_codigo == sector)
        if period:
            query = query.where(Indicator.period == period)
            count_query = count_query.where(Indicator.period == period)

        total = (await self.db.execute(count_query)).scalar()
        offset = (page - 1) * per_page
        result = await self.db.execute(
            query.offset(offset).limit(per_page).order_by(Indicator.created_at.desc())
        )
        items = result.scalars().all()
        return items, total

    async def get(self, indicator_id: UUID) -> Indicator:
        result = await self.db.execute(select(Indicator).where(Indicator.id == indicator_id))
        indicator = result.scalar_one_or_none()
        if not indicator:
            raise AppException(404, "Indicator not found")
        return indicator

    async def create(self, data: IndicatorCreate) -> Indicator:
        indicator = Indicator(**data.model_dump())
        self.db.add(indicator)
        await self.db.flush()
        return indicator

    async def update(self, indicator_id: UUID, data: IndicatorUpdate) -> Indicator:
        indicator = await self.get(indicator_id)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(indicator, key, val)
        await self.db.flush()
        return indicator

    async def delete(self, indicator_id: UUID) -> None:
        indicator = await self.get(indicator_id)
        await self.db.delete(indicator)
        await self.db.flush()
