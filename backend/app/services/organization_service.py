from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.models.organization import Organization
from app.schemas.organization import OrganizationCreate, OrganizationUpdate
from app.services.query_helpers import apply_search, apply_sorting


class OrganizationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(
        self, page: int, per_page: int, tipo: str | None = None,
        sector_codigo: str | None = None, q: str | None = None,
        pais: str | None = None, provincia: str | None = None,
        sort_by: str | None = None, sort_order: str = "desc",
    ) -> tuple[list[Organization], int]:
        query = select(Organization)
        count_query = select(func.count(Organization.id))

        if tipo:
            query = query.where(Organization.tipo == tipo)
            count_query = count_query.where(Organization.tipo == tipo)
        if sector_codigo:
            query = query.where(Organization.sector_codigo == sector_codigo)
            count_query = count_query.where(Organization.sector_codigo == sector_codigo)
        if q:
            query = apply_search(query, Organization, q, [Organization.nombre, Organization.siglas])
            count_query = apply_search(count_query, Organization, q, [Organization.nombre, Organization.siglas])
        if pais:
            query = query.where(Organization.pais == pais)
            count_query = count_query.where(Organization.pais == pais)
        if provincia:
            query = query.where(Organization.provincia == provincia)
            count_query = count_query.where(Organization.provincia == provincia)

        total = (await self.db.execute(count_query)).scalar()
        offset = (page - 1) * per_page

        allowed_sorts = {
            "nombre": Organization.nombre,
            "siglas": Organization.siglas,
            "created_at": Organization.created_at,
            "tipo": Organization.tipo,
        }
        if sort_by:
            query = apply_sorting(query, Organization, sort_by, sort_order, allowed_sorts)
        else:
            query = query.order_by(Organization.created_at.desc())

        result = await self.db.execute(query.offset(offset).limit(per_page))
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
