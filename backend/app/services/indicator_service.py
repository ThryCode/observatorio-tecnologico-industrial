from uuid import UUID

from redis.asyncio import Redis
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.models.indicator import Indicator
from app.schemas.indicator import IndicatorCreate, IndicatorUpdate
from app.services.cache import invalidate_pattern
from app.services.query_helpers import apply_search, apply_sorting


class IndicatorService:
    def __init__(self, db: AsyncSession, redis: Redis | None = None):
        self.db = db
        self.redis = redis

    async def list(self, page: int, per_page: int, sector: str | None = None,
                   period: str | None = None, q: str | None = None,
                   sort_by: str | None = None, sort_order: str = "desc") -> tuple[list[Indicator], int]:
        query = select(Indicator)
        count_query = select(func.count(Indicator.id))

        if sector:
            query = query.where(Indicator.sector_codigo == sector)
            count_query = count_query.where(Indicator.sector_codigo == sector)
        if period:
            query = query.where(Indicator.period == period)
            count_query = count_query.where(Indicator.period == period)
        if q:
            query = apply_search(query, Indicator, q, [Indicator.name, Indicator.code, Indicator.source])
            count_query = apply_search(count_query, Indicator, q, [Indicator.name, Indicator.code, Indicator.source])

        total = (await self.db.execute(count_query)).scalar()
        offset = (page - 1) * per_page

        allowed_sorts = {
            "name": Indicator.name,
            "created_at": Indicator.created_at,
            "period": Indicator.period,
            "value": Indicator.value,
        }
        query = apply_sorting(query, Indicator, sort_by, sort_order, allowed_sorts)
        if not sort_by:
            query = query.order_by(Indicator.created_at.desc())

        result = await self.db.execute(
            query.offset(offset).limit(per_page)
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
        await invalidate_pattern(self.redis, "indicators:list:*")
        return indicator

    async def update(self, indicator_id: UUID, data: IndicatorUpdate) -> Indicator:
        indicator = await self.get(indicator_id)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(indicator, key, val)
        await self.db.flush()
        await self.db.refresh(indicator)
        await invalidate_pattern(self.redis, "indicators:*")
        return indicator

    async def delete(self, indicator_id: UUID) -> None:
        indicator = await self.get(indicator_id)
        await self.db.delete(indicator)
        await self.db.flush()
        await invalidate_pattern(self.redis, "indicators:*")
