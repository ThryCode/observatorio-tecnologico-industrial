from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.dependencies import get_db, require_role
from app.graph.sync_trigger import schedule_graph_sync
from app.models.user import User
from app.schemas.common import Message, PaginatedResponse
from app.schemas.organization import OrganizationCreate, OrganizationResponse, OrganizationUpdate
from app.schemas.user import UserResponse
from app.services.organization_service import OrganizationService

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.get("", response_model=PaginatedResponse[OrganizationResponse])
async def list_organizations(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    tipo: str | None = Query(None),
    sector_codigos: str | None = Query(None),
    q: str | None = Query(None),
    pais: str | None = Query(None),
    provincia: str | None = Query(None),
    sort_by: str | None = Query(None),
    sort_order: str = Query("desc"),
    db: AsyncSession = Depends(get_db),
):
    codes = [c.strip() for c in sector_codigos.split(",")] if sector_codigos else None
    items, total = await OrganizationService(db).list(
        page, per_page, tipo, codes, q, pais, provincia, sort_by, sort_order
    )
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=(total + per_page - 1) // per_page,
    )


@router.get("/{org_id}", response_model=OrganizationResponse)
async def get_organization(org_id: UUID, db: AsyncSession = Depends(get_db)):
    return await OrganizationService(db).get(org_id)


@router.get("/{org_id}/representative", response_model=UserResponse)
async def get_organization_representative(org_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.organization_id == org_id))
    rep = result.scalar_one_or_none()
    if not rep:
        raise AppException(404, "No representative found for this organization")
    return rep


@router.post("", response_model=OrganizationResponse, status_code=201)
async def create_organization(
    data: OrganizationCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("representante")),
):
    result = await OrganizationService(db).create(data)
    schedule_graph_sync(background_tasks)
    return result


@router.put("/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: UUID,
    data: OrganizationUpdate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("representante")),
):
    if current_user.organization_id != org_id:
        raise AppException(403, "Solo puedes editar tu propia empresa")
    result = await OrganizationService(db).update(org_id, data)
    schedule_graph_sync(background_tasks)
    return result


@router.delete("/{org_id}", response_model=Message)
async def delete_organization(
    org_id: UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin_mindus")),
):
    await OrganizationService(db).delete(org_id)
    schedule_graph_sync(background_tasks)
    return Message(detail="Organization deleted")
