from datetime import datetime
from uuid import UUID

from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert import Alert
from app.schemas.alert import AlertCreate, AlertUpdate
from app.services.base import BaseService
from app.services.query_helpers import apply_date_range, apply_search


class AlertService(BaseService[Alert, AlertCreate, AlertUpdate]):
    def __init__(self, db: AsyncSession):
        super().__init__(Alert, db)

    async def list(
        self, page: int, per_page: int, unread_only: bool = False,
        q: str | None = None, severidad: str | None = None,
        sector_codigos: list[str] | None = None,
        fecha_desde: datetime | None = None, fecha_hasta: datetime | None = None,
        sort_by: str | None = None, sort_order: str = "desc",
    ) -> tuple[list[Alert], int]:
        query = select(Alert)
        count_query = select(func.count(Alert.id))

        if unread_only:
            query = query.where(Alert.leida == False)  # noqa: E712
            count_query = count_query.where(Alert.leida == False)  # noqa: E712
        if severidad:
            query = query.where(Alert.severidad == severidad)
            count_query = count_query.where(Alert.severidad == severidad)
        if sector_codigos:
            query = query.where(or_(Alert.sector_codigo.in_(sector_codigos), Alert.sector_codigo.is_(None)))
            count_query = count_query.where(or_(Alert.sector_codigo.in_(sector_codigos), Alert.sector_codigo.is_(None)))

        query = apply_search(query, Alert, q, [Alert.titulo, Alert.descripcion])
        count_query = apply_search(count_query, Alert, q, [Alert.titulo, Alert.descripcion])
        query = apply_date_range(query, Alert.fecha, fecha_desde, fecha_hasta)
        count_query = apply_date_range(count_query, Alert.fecha, fecha_desde, fecha_hasta)

        allowed_sorts = {
            "fecha": Alert.fecha,
            "titulo": Alert.titulo,
            "severidad": Alert.severidad,
            "created_at": Alert.created_at,
        }
        return await self._paginate(count_query, query, page, per_page, sort_by, sort_order, allowed_sorts)

    async def mark_read(self, alert_id: UUID) -> Alert:
        alert = await self.get(alert_id)
        alert.leida = True
        await self.db.flush()
        await self.db.refresh(alert)
        return alert

    async def mark_all_read(self) -> int:
        result = await self.db.execute(
            select(func.count(Alert.id)).where(Alert.leida == False)  # noqa: E712
        )
        count = result.scalar() or 0
        await self.db.execute(
            update(Alert).where(Alert.leida == False).values(leida=True)  # noqa: E712
        )
        await self.db.flush()
        return count
