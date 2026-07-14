from uuid import UUID

from redis.asyncio import Redis
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.models.indicator import Indicator
from app.schemas.indicator import IndicatorCreate, IndicatorUpdate
from app.services.cache import cache_key, get_cached, invalidate_pattern, set_cached


class IndicatorService:
    def __init__(self, db: AsyncSession, redis: Redis | None = None):
        self.db = db
        self.redis = redis

    async def list(self, page: int, per_page: int, sector: str | None = None,
                   period: str | None = None) -> tuple[list[Indicator], int]:
        key = cache_key("indicators:list", page, per_page, sector=sector, period=period)
        cached = await get_cached(self.redis, key)
        if cached is not None:
            return [Indicator(**item) for item in cached["items"]], cached["total"]

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
        serialized = [
            i.to_dict() if hasattr(i, "to_dict") else {"id": str(i.id), "code": i.code}
            for i in items
        ]
        await set_cached(self.redis, key, {"items": serialized, "total": total}, ttl=300)
        return items, total

    async def get(self, indicator_id: UUID) -> Indicator:
        key = cache_key("indicators:get", indicator_id)
        cached = await get_cached(self.redis, key)
        if cached is not None:
            return Indicator(**cached)

        result = await self.db.execute(select(Indicator).where(Indicator.id == indicator_id))
        indicator = result.scalar_one_or_none()
        if not indicator:
            raise AppException(404, "Indicator not found")
        cached_data = {
            "id": str(indicator.id),
            "code": indicator.code,
            "name": indicator.name,
            "value": float(indicator.value) if indicator.value else None,
            "unit": indicator.unit,
            "source": indicator.source,
            "period": indicator.period.value if indicator.period else None,
            "sector_codigo": indicator.sector_codigo,
        }
        await set_cached(self.redis, key, cached_data, ttl=300)
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
