from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, require_role
from app.models.user import User, UserRole
from app.schemas.common import Message, PaginatedResponse
from app.schemas.competitiveness import CompetitivenessCreate, CompetitivenessResponse, CompetitivenessUpdate
from app.services.competitiveness_service import CompetitivenessService

router = APIRouter(prefix="/competitiveness", tags=["competitiveness"])


@router.get("", response_model=PaginatedResponse[CompetitivenessResponse])
async def list_competitiveness(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sector_codigo: str | None = Query(None),
    periodo: str | None = Query(None),
    q: str | None = Query(None),
    sort_by: str | None = Query(None),
    sort_order: str = Query("desc"),
    db: AsyncSession = Depends(get_db),
):
    items, total = await CompetitivenessService(db).list(
        page, per_page, sector_codigo, periodo, q, sort_by, sort_order,
    )
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=(total + per_page - 1) // per_page,
    )


@router.get("/{index_id}", response_model=CompetitivenessResponse)
async def get_competitiveness(index_id: UUID, db: AsyncSession = Depends(get_db)):
    return await CompetitivenessService(db).get(index_id)


@router.post("", response_model=CompetitivenessResponse, status_code=201)
async def create_competitiveness(
    data: CompetitivenessCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN_MINDUS)),
):
    return await CompetitivenessService(db).create(data)


@router.put("/{index_id}", response_model=CompetitivenessResponse)
async def update_competitiveness(
    index_id: UUID,
    data: CompetitivenessUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN_MINDUS)),
):
    return await CompetitivenessService(db).update(index_id, data)


@router.delete("/{index_id}", response_model=Message)
async def delete_competitiveness(
    index_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN_MINDUS)),
):
    await CompetitivenessService(db).delete(index_id)
    return Message(detail="Competitiveness index deleted")
