from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.models.organization import Organization
from app.schemas.organization import OrganizationCreate, OrganizationUpdate


class OrganizationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, page: int, per_page: int, tipo: str | None = None) -> tuple[list[Organization], int]:
        query = select(Organization)
        count_query = select(func.count(Organization.id))

        if tipo:
            query = query.where(Organization.tipo == tipo)
            count_query = count_query.where(Organization.tipo == tipo)

        total = (await self.db.execute(count_query)).scalar()
        offset = (page - 1) * per_page
        result = await self.db.execute(
            query.offset(offset).limit(per_page).order_by(Organization.created_at.desc())
        )
        items = result.scalars().all()
        return items, total

    async def get(self, org_id: UUID) -> Organization:
        result = await self.db.execute(select(Organization).where(Organization.id == org_id))
        org = result.scalar_one_or_none()
        if not org:
            raise AppException(404, "Organization not found")
        return org

    async def create(self, data: OrganizationCreate) -> Organization:
        org = Organization(**data.model_dump())
        self.db.add(org)
        await self.db.flush()
        return org

    async def update(self, org_id: UUID, data: OrganizationUpdate) -> Organization:
        org = await self.get(org_id)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(org, key, val)
        await self.db.flush()
        await self.db.refresh(org)
        return org

    async def delete(self, org_id: UUID) -> None:
        org = await self.get(org_id)
        await self.db.delete(org)
        await self.db.flush()
