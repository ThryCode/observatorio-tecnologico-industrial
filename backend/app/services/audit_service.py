from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


class AuditService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log(
        self,
        user_id: UUID,
        action: str,
        entity_type: str,
        entity_id: str,
        changes: dict | None = None,
        ip_address: str | None = None,
    ) -> AuditLog:
        entry = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            changes=changes,
            ip_address=ip_address,
        )
        self.db.add(entry)
        await self.db.flush()
        return entry

    async def get_logs(
        self,
        entity_type: str | None = None,
        entity_id: str | None = None,
        user_id: UUID | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[list[AuditLog], int]:
        query = select(AuditLog)
        count_query = select(func.count(AuditLog.id))

        if entity_type:
            query = query.where(AuditLog.entity_type == entity_type)
            count_query = count_query.where(AuditLog.entity_type == entity_type)
        if entity_id:
            query = query.where(AuditLog.entity_id == entity_id)
            count_query = count_query.where(AuditLog.entity_id == entity_id)
        if user_id:
            query = query.where(AuditLog.user_id == user_id)
            count_query = count_query.where(AuditLog.user_id == user_id)

        query = query.order_by(AuditLog.created_at.desc())
        total = (await self.db.execute(count_query)).scalar()
        result = await self.db.execute(query.offset(offset).limit(limit))
        items = result.scalars().all()
        return items, total
