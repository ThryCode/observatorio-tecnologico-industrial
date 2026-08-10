from fastapi import APIRouter, BackgroundTasks, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, require_role
from app.graph.sync_trigger import schedule_graph_sync
from app.models.user import User, UserRole
from app.schemas.common import Message, PaginatedResponse
from app.schemas.industrial_sector import (
    IndustrialSectorCreate,
    IndustrialSectorResponse,
    IndustrialSectorUpdate,
)
from app.services.industrial_sector_service import IndustrialSectorService

router = APIRouter(prefix="/industrial-sectors", tags=["industrial-sectors"])


@router.get("", response_model=PaginatedResponse[IndustrialSectorResponse])
async def list_sectors(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    q: str | None = Query(None),
    sort_by: str | None = Query(None),
    sort_order: str = Query("desc"),
    db: AsyncSession = Depends(get_db),
):
    items, total = await IndustrialSectorService(db).list(page, per_page, q, sort_by, sort_order)
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=(total + per_page - 1) // per_page,
    )


@router.get("/{codigo}", response_model=IndustrialSectorResponse)
async def get_sector(codigo: str, db: AsyncSession = Depends(get_db)):
    return await IndustrialSectorService(db).get(codigo)


@router.post("", response_model=IndustrialSectorResponse, status_code=201)
async def create_sector(
    data: IndustrialSectorCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN_MINDUS)),
):
    result = await IndustrialSectorService(db).create(data)
    schedule_graph_sync(background_tasks)
    return result


@router.put("/{codigo}", response_model=IndustrialSectorResponse)
async def update_sector(
    codigo: str,
    data: IndustrialSectorUpdate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN_MINDUS)),
):
    result = await IndustrialSectorService(db).update(codigo, data)
    schedule_graph_sync(background_tasks)
    return result


@router.delete("/{codigo}", response_model=Message)
async def delete_sector(
    codigo: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN_MINDUS)),
):
    await IndustrialSectorService(db).delete(codigo)
    schedule_graph_sync(background_tasks)
    return Message(detail="Industrial sector deleted")
