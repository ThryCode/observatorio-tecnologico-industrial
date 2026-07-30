from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization import Organization
from app.schemas.organization import OrganizationCreate, OrganizationUpdate
from app.services.base import BaseService
from app.services.query_helpers import apply_search


class OrganizationService(BaseService[Organization, OrganizationCreate, OrganizationUpdate]):
    def __init__(self, db: AsyncSession):
        super().__init__(Organization, db)

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

        allowed_sorts = {
            "nombre": Organization.nombre,
            "siglas": Organization.siglas,
            "created_at": Organization.created_at,
            "tipo": Organization.tipo,
        }
        return await self._paginate(count_query, query, page, per_page, sort_by, sort_order, allowed_sorts)
