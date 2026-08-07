from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.technology import Technology
from app.schemas.technology import TechnologyCreate, TechnologyResponse, TechnologyUpdate
from app.services.audit_service import AuditService
from app.services.base import BaseService
from app.services.query_helpers import apply_search


class TechnologyService(BaseService[Technology, TechnologyCreate, TechnologyUpdate]):
    def __init__(self, db: AsyncSession):
        super().__init__(Technology, db)

    async def create_with_audit(
        self, data: TechnologyCreate, user_id: UUID, ip_address: str | None = None
    ) -> Technology:
        tech = await self.create(data)
        await AuditService(self.db).log(
            user_id=user_id, action="CREATE", entity_type="Technology",
            entity_id=str(tech.id), changes=TechnologyResponse.model_validate(tech).model_dump(mode="json"),
            ip_address=ip_address,
        )
        return tech

    async def update_with_audit(
        self, tech_id: UUID, data: TechnologyUpdate, user_id: UUID, ip_address: str | None = None
    ) -> Technology:
        old = await self.get(tech_id)
        old_data = TechnologyResponse.model_validate(old).model_dump(mode="json")
        tech = await self.update(tech_id, data)
        await AuditService(self.db).log(
            user_id=user_id, action="UPDATE", entity_type="Technology",
            entity_id=str(tech_id),
            changes={"old": old_data, "new": data.model_dump(exclude_unset=True, mode="json")},
            ip_address=ip_address,
        )
        return tech

    async def delete_with_audit(self, tech_id: UUID, user_id: UUID, ip_address: str | None = None) -> None:
        old = await self.get(tech_id)
        await self.delete(tech_id)
        await AuditService(self.db).log(
            user_id=user_id, action="DELETE", entity_type="Technology",
            entity_id=str(tech_id),
            changes={"nombre": old.nombre},
            ip_address=ip_address,
        )

    async def list(self, page: int, per_page: int, sector_codigo: str | None = None,
                   q: str | None = None, trl_nivel: int | None = None,
                   sort_by: str | None = None, sort_order: str = "desc") -> tuple[list[Technology], int]:
        query = select(Technology)
        count_query = select(func.count(Technology.id))

        if sector_codigo:
            query = query.where(Technology.sector_codigo == sector_codigo)
            count_query = count_query.where(Technology.sector_codigo == sector_codigo)
        if trl_nivel is not None:
            query = query.where(Technology.trl_nivel == trl_nivel)
            count_query = count_query.where(Technology.trl_nivel == trl_nivel)
        if q:
            search_fields = [Technology.nombre, Technology.descripcion, Technology.palabras_clave]
            query = apply_search(query, Technology, q, search_fields)
            count_query = apply_search(count_query, Technology, q, search_fields)

        allowed_sorts = {
            "nombre": Technology.nombre,
            "created_at": Technology.created_at,
            "trl_nivel": Technology.trl_nivel,
        }
        return await self._paginate(count_query, query, page, per_page, sort_by, sort_order, allowed_sorts)
