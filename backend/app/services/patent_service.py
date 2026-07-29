from datetime import date
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.models.patent import Patent
from app.schemas.patent import PatentCreate, PatentUpdate
from app.services.query_helpers import apply_date_range, apply_sorting


class PatentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, page: int, per_page: int, sector: str | None = None,
                   status: str | None = None, q: str | None = None,
                   fecha_desde: date | None = None, fecha_hasta: date | None = None,
                   sort_by: str | None = None, sort_order: str = "desc") -> tuple[list[Patent], int]:
        query = select(Patent)
        count_query = select(func.count(Patent.id))

        if sector:
            query = query.where(Patent.technological_sector == sector)
            count_query = count_query.where(Patent.technological_sector == sector)
        if status:
            query = query.where(Patent.status == status)
            count_query = count_query.where(Patent.status == status)
        if q:
            like = f"%{q}%"
            query = query.where(
                Patent.title.ilike(like) | Patent.patent_number.ilike(like) | Patent.applicant.ilike(like)
            )
            count_query = count_query.where(
                Patent.title.ilike(like) | Patent.patent_number.ilike(like) | Patent.applicant.ilike(like)
            )
        if fecha_desde or fecha_hasta:
            query = apply_date_range(query, Patent.filing_date, fecha_desde, fecha_hasta)
            count_query = apply_date_range(count_query, Patent.filing_date, fecha_desde, fecha_hasta)

        total = (await self.db.execute(count_query)).scalar()
        offset = (page - 1) * per_page

        allowed_sorts = {
            "title": Patent.title,
            "filing_date": Patent.filing_date,
            "created_at": Patent.created_at,
            "status": Patent.status,
        }
        if sort_by:
            query = apply_sorting(query, Patent, sort_by, sort_order, allowed_sorts)
        else:
            query = query.order_by(Patent.created_at.desc())

        result = await self.db.execute(query.offset(offset).limit(per_page))
        items = result.scalars().all()
        return items, total

    async def get(self, patent_id: UUID) -> Patent:
        result = await self.db.execute(select(Patent).where(Patent.id == patent_id))
        patent = result.scalar_one_or_none()
        if not patent:
            raise AppException(404, "Patent not found")
        return patent

    async def create(self, data: PatentCreate) -> Patent:
        patent = Patent(**data.model_dump())
        self.db.add(patent)
        await self.db.flush()
        return patent

    async def update(self, patent_id: UUID, data: PatentUpdate) -> Patent:
        patent = await self.get(patent_id)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(patent, key, val)
        await self.db.flush()
        await self.db.refresh(patent)
        return patent

    async def delete(self, patent_id: UUID) -> None:
        patent = await self.get(patent_id)
        await self.db.delete(patent)
        await self.db.flush()
