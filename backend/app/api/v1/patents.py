import enum
from datetime import date, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, require_role
from app.models.user import User, UserRole
from app.schemas.common import Message, PaginatedResponse
from app.schemas.patent import PatentCreate, PatentResponse, PatentUpdate
from app.services.audit_service import AuditService
from app.services.patent_service import PatentService


def _serialize(obj):
    if obj is None:
        return None
    d = {}
    for col in obj.__table__.columns:
        val = getattr(obj, col.name)
        if isinstance(val, (date, datetime)):
            val = val.isoformat()
        elif isinstance(val, UUID):
            val = str(val)
        elif isinstance(val, enum.Enum):
            val = val.value
        d[col.name] = val
    return d

router = APIRouter(prefix="/patents", tags=["patents"])


@router.get("", response_model=PaginatedResponse[PatentResponse])
async def list_patents(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sector: str | None = Query(None),
    status: str | None = Query(None),
    q: str | None = Query(None),
    fecha_desde: date | None = Query(None),
    fecha_hasta: date | None = Query(None),
    sort_by: str | None = Query(None),
    sort_order: str = Query("desc"),
    db: AsyncSession = Depends(get_db),
):
    items, total = await PatentService(db).list(
        page, per_page, sector, status, q, fecha_desde, fecha_hasta, sort_by, sort_order
    )
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=(total + per_page - 1) // per_page,
    )


@router.get("/{patent_id}", response_model=PatentResponse)
async def get_patent(patent_id: UUID, db: AsyncSession = Depends(get_db)):
    return await PatentService(db).get(patent_id)


@router.post("", response_model=PatentResponse, status_code=201)
async def create_patent(
    data: PatentCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN_MINDUS, UserRole.ANALISTA)),
):
    patent = await PatentService(db).create(data)
    ip = request.client.host if request.client else None
    await AuditService(db).log(
        user_id=current_user.id,
        action="CREATE",
        entity_type="Patent",
        entity_id=str(patent.id),
        changes=_serialize(patent),
        ip_address=ip,
    )
    return patent


@router.put("/{patent_id}", response_model=PatentResponse)
async def update_patent(
    patent_id: UUID,
    data: PatentUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN_MINDUS)),
):
    old = await PatentService(db).get(patent_id)
    patent = await PatentService(db).update(patent_id, data)
    ip = request.client.host if request.client else None
    await AuditService(db).log(
        user_id=current_user.id,
        action="UPDATE",
        entity_type="Patent",
        entity_id=str(patent_id),
        changes={"old": _serialize(old), "new": data.model_dump(exclude_unset=True, mode="json")},
        ip_address=ip,
    )
    return patent


@router.delete("/{patent_id}", response_model=Message)
async def delete_patent(
    patent_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN_MINDUS)),
):
    old = await PatentService(db).get(patent_id)
    await PatentService(db).delete(patent_id)
    ip = request.client.host if request.client else None
    await AuditService(db).log(
        user_id=current_user.id,
        action="DELETE",
        entity_type="Patent",
        entity_id=str(patent_id),
        changes={"title": old.title, "patent_number": old.patent_number},
        ip_address=ip,
    )
    return Message(detail="Patent deleted")
