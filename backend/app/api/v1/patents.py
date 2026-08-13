from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, require_role
from app.graph.sync_trigger import schedule_graph_sync
from app.models.user import User
from app.schemas.common import Message, PaginatedResponse
from app.schemas.patent import PatentCreate, PatentResponse, PatentUpdate
from app.services.patent_service import PatentService

router = APIRouter(prefix="/patents", tags=["patents"])


@router.get("", response_model=PaginatedResponse[PatentResponse])
async def list_patents(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sector: str | None = Query(None),
    status: str | None = Query(None),
    q: str | None = Query(None),
    fecha_desde=None,
    fecha_hasta=None,
    sort_by: str | None = Query(None),
    sort_order: str = Query("desc"),
    db: AsyncSession = Depends(get_db),
):
    items, total = await PatentService(db).list(
        page, per_page, sector, status, q, fecha_desde, fecha_hasta, sort_by, sort_order
    )
    return PaginatedResponse(
        items=items, total=total, page=page, per_page=per_page,
        total_pages=(total + per_page - 1) // per_page,
    )


@router.get("/{patent_id}")
async def get_patent(patent_id: UUID, db: AsyncSession = Depends(get_db)):
    return await PatentService(db).get(patent_id)


@router.post("", status_code=201)
async def create_patent(
    data: PatentCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin_mindus", "analista")),
):
    ip = request.client.host if request.client else None
    result = await PatentService(db).create_with_audit(data, current_user.id, ip)
    schedule_graph_sync(background_tasks)
    return result


@router.put("/{patent_id}")
async def update_patent(
    patent_id: UUID,
    data: PatentUpdate,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin_mindus")),
):
    ip = request.client.host if request.client else None
    result = await PatentService(db).update_with_audit(patent_id, data, current_user.id, ip)
    schedule_graph_sync(background_tasks)
    return result


@router.delete("/{patent_id}", response_model=Message)
async def delete_patent(
    patent_id: UUID,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin_mindus")),
):
    ip = request.client.host if request.client else None
    await PatentService(db).delete_with_audit(patent_id, current_user.id, ip)
    schedule_graph_sync(background_tasks)
    return Message(detail="Patent deleted")
