from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, require_role
from app.models.user import User
from app.schemas.audit_log import AuditLogResponse
from app.schemas.common import PaginatedResponse
from app.services.audit_service import AuditService

router = APIRouter(prefix="/audit-logs", tags=["audit_logs"])


@router.get("", response_model=PaginatedResponse[AuditLogResponse])
async def list_audit_logs(
    entity_type: str | None = Query(None),
    entity_id: str | None = Query(None),
    user_id: UUID | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin_mindus")),
):
    offset = (page - 1) * per_page
    items, total = await AuditService(db).get_logs(
        entity_type=entity_type,
        entity_id=entity_id,
        user_id=user_id,
        offset=offset,
        limit=per_page,
    )
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=(total + per_page - 1) // per_page,
    )
