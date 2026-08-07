from datetime import date
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.patent import Patent
from app.schemas.patent import PatentCreate, PatentResponse, PatentUpdate
from app.services.audit_service import AuditService
from app.services.base import BaseService
from app.services.query_helpers import apply_date_range, apply_search


class PatentService(BaseService[Patent, PatentCreate, PatentUpdate]):
    def __init__(self, db: AsyncSession):
        super().__init__(Patent, db)

    async def create_with_audit(self, data: PatentCreate, user_id: UUID, ip_address: str | None = None) -> Patent:
        patent = await self.create(data)
        await AuditService(self.db).log(
            user_id=user_id, action="CREATE", entity_type="Patent",
            entity_id=str(patent.id), changes=PatentResponse.model_validate(patent).model_dump(mode="json"),
            ip_address=ip_address,
        )
        return patent

    async def update_with_audit(
        self, patent_id: UUID, data: PatentUpdate, user_id: UUID, ip_address: str | None = None
    ) -> Patent:
        old = await self.get(patent_id)
        old_data = PatentResponse.model_validate(old).model_dump(mode="json")
        patent = await self.update(patent_id, data)
        await AuditService(self.db).log(
            user_id=user_id, action="UPDATE", entity_type="Patent",
            entity_id=str(patent_id),
            changes={"old": old_data, "new": data.model_dump(exclude_unset=True, mode="json")},
            ip_address=ip_address,
        )
        return patent

    async def delete_with_audit(self, patent_id: UUID, user_id: UUID, ip_address: str | None = None) -> None:
        old = await self.get(patent_id)
        await self.delete(patent_id)
        await AuditService(self.db).log(
            user_id=user_id, action="DELETE", entity_type="Patent",
            entity_id=str(patent_id),
            changes={"title": old.title, "patent_number": old.patent_number},
            ip_address=ip_address,
        )

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
            search_fields = [Patent.title, Patent.patent_number, Patent.applicant]
            query = apply_search(query, Patent, q, search_fields)
            count_query = apply_search(count_query, Patent, q, search_fields)
        if fecha_desde or fecha_hasta:
            query = apply_date_range(query, Patent.filing_date, fecha_desde, fecha_hasta)
            count_query = apply_date_range(count_query, Patent.filing_date, fecha_desde, fecha_hasta)

        allowed_sorts = {
            "title": Patent.title,
            "filing_date": Patent.filing_date,
            "created_at": Patent.created_at,
            "status": Patent.status,
        }
        return await self._paginate(count_query, query, page, per_page, sort_by, sort_order, allowed_sorts)
