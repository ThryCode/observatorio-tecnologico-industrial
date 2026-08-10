from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, require_role
from app.graph.sync_trigger import schedule_graph_sync
from app.models.user import User, UserRole
from app.schemas.common import Message, PaginatedResponse
from app.schemas.technology import TechnologyCreate, TechnologyResponse, TechnologyUpdate
from app.services.technology_service import TechnologyService

router = APIRouter(prefix="/technologies", tags=["technologies"])


@router.get("", response_model=PaginatedResponse[TechnologyResponse])
async def list_technologies(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sector_codigo: str | None = Query(None),
    q: str | None = Query(None),
    trl_nivel: int | None = Query(None),
    sort_by: str | None = Query(None),
    sort_order: str = Query("desc"),
    db: AsyncSession = Depends(get_db),
):
    items, total = await TechnologyService(db).list(page, per_page, sector_codigo, q, trl_nivel, sort_by, sort_order)
    return PaginatedResponse(
        items=items, total=total, page=page, per_page=per_page,
        total_pages=(total + per_page - 1) // per_page,
    )


@router.get("/{tech_id}")
async def get_technology(tech_id: UUID, db: AsyncSession = Depends(get_db)):
    return await TechnologyService(db).get(tech_id)


@router.post("", status_code=201)
async def create_technology(
    data: TechnologyCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN_MINDUS)),
):
    ip = request.client.host if request.client else None
    result = await TechnologyService(db).create_with_audit(data, current_user.id, ip)
    schedule_graph_sync(background_tasks)
    return result


@router.put("/{tech_id}")
async def update_technology(
    tech_id: UUID,
    data: TechnologyUpdate,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN_MINDUS)),
):
    ip = request.client.host if request.client else None
    result = await TechnologyService(db).update_with_audit(tech_id, data, current_user.id, ip)
    schedule_graph_sync(background_tasks)
    return result


@router.delete("/{tech_id}", response_model=Message)
async def delete_technology(
    tech_id: UUID,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN_MINDUS)),
):
    ip = request.client.host if request.client else None
    await TechnologyService(db).delete_with_audit(tech_id, current_user.id, ip)
    schedule_graph_sync(background_tasks)
    return Message(detail="Technology deleted")
