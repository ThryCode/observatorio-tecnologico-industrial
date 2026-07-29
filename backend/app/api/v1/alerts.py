from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db, require_role
from app.models.user import User, UserRole
from app.schemas.alert import AlertCreate, AlertResponse, AlertUpdate
from app.schemas.common import Message, PaginatedResponse
from app.services.alert_service import AlertService
from app.services.audit_service import AuditService
from app.ws_manager import manager

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=PaginatedResponse[AlertResponse])
async def list_alerts(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    unread_only: bool = Query(False),
    q: str | None = Query(None),
    severidad: str | None = Query(None),
    sector_codigo: str | None = Query(None),
    fecha_desde: datetime | None = Query(None),
    fecha_hasta: datetime | None = Query(None),
    sort_by: str | None = Query(None),
    sort_order: str = Query("desc"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    items, total = await AlertService(db).list(
        page, per_page, unread_only, q, severidad, sector_codigo,
        fecha_desde, fecha_hasta, sort_by, sort_order,
    )
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=(total + per_page - 1) // per_page,
    )


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await AlertService(db).get(alert_id)


@router.post("", response_model=AlertResponse, status_code=201)
async def create_alert(
    data: AlertCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = await AlertService(db).create(data)
    ip = request.client.host if request.client else None
    await AuditService(db).log(
        user_id=current_user.id, action="CREATE", entity_type="Alert",
        entity_id=str(alert.id), changes=data.model_dump(), ip_address=ip,
    )
    await manager.send_to_user(str(current_user.id), {
        "type": "new_alert", "alert": {"id": str(alert.id), "titulo": alert.titulo},
    })
    return alert


@router.put("/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: UUID,
    data: AlertUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    old = await AlertService(db).get(alert_id)
    alert = await AlertService(db).update(alert_id, data)
    ip = request.client.host if request.client else None
    await AuditService(db).log(
        user_id=current_user.id, action="UPDATE", entity_type="Alert",
        entity_id=str(alert_id),
        changes={"old": {"titulo": old.titulo}, "new": data.model_dump(exclude_unset=True)},
        ip_address=ip,
    )
    return alert


@router.patch("/{alert_id}/read", response_model=AlertResponse)
async def mark_alert_read(
    alert_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN_MINDUS)),
):
    return await AlertService(db).mark_read(alert_id)


@router.post("/read-all", response_model=Message)
async def mark_all_alerts_read(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN_MINDUS)),
):
    count = await AlertService(db).mark_all_read()
    return Message(detail=f"{count} alerts marked as read")


@router.delete("/{alert_id}", response_model=Message)
async def delete_alert(
    alert_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN_MINDUS)),
):
    old = await AlertService(db).get(alert_id)
    await AlertService(db).delete(alert_id)
    ip = request.client.host if request.client else None
    await AuditService(db).log(
        user_id=current_user.id, action="DELETE", entity_type="Alert",
        entity_id=str(alert_id), changes={"titulo": old.titulo}, ip_address=ip,
    )
    return Message(detail="Alert deleted")
