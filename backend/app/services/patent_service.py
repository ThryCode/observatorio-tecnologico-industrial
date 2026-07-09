from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.patent import Patent
from app.schemas.patent import PatentCreate, PatentUpdate
from app.core.exceptions import AppException


class PatentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, page: int, per_page: int, sector: str | None = None,
                   status: str | None = None, q: str | None = None):
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

        total = (await self.db.execute(count_query)).scalar()
        offset = (page - 1) * per_page
        result = await self.db.execute(
            query.offset(offset).limit(per_page).order_by(Patent.created_at.desc())
        )
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
        return patent

    async def delete(self, patent_id: UUID) -> None:
        patent = await self.get(patent_id)
        await self.db.delete(patent)
        await self.db.flush()
