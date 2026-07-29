from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_redis, require_role
from app.models.user import User, UserRole
from app.schemas.common import Message, PaginatedResponse
from app.schemas.indicator import IndicatorCreate, IndicatorResponse, IndicatorUpdate
from app.services.indicator_service import IndicatorService

router = APIRouter(prefix="/indicators", tags=["indicators"])


def _service(db, redis):
    return IndicatorService(db, redis)


@router.get("", response_model=PaginatedResponse[IndicatorResponse])
async def list_indicators(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sector: str | None = Query(None),
    period: str | None = Query(None),
    q: str | None = Query(None),
    sort_by: str | None = Query(None),
    sort_order: str = Query("desc"),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
):
    items, total = await _service(db, redis).list(page, per_page, sector, period, q, sort_by, sort_order)
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=(total + per_page - 1) // per_page,
    )


@router.get("/{indicator_id}", response_model=IndicatorResponse)
async def get_indicator(indicator_id: UUID, db: AsyncSession = Depends(get_db), redis=Depends(get_redis)):
    return await _service(db, redis).get(indicator_id)


@router.post("", response_model=IndicatorResponse, status_code=201)
async def create_indicator(
    data: IndicatorCreate,
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
    _: User = Depends(require_role(UserRole.ADMIN_MINDUS, UserRole.ANALISTA)),
):
    return await _service(db, redis).create(data)


@router.put("/{indicator_id}", response_model=IndicatorResponse)
async def update_indicator(
    indicator_id: UUID,
    data: IndicatorUpdate,
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
    _: User = Depends(require_role(UserRole.ADMIN_MINDUS)),
):
    return await _service(db, redis).update(indicator_id, data)


@router.delete("/{indicator_id}", response_model=Message)
async def delete_indicator(
    indicator_id: UUID,
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
    _: User = Depends(require_role(UserRole.ADMIN_MINDUS)),
):
    await _service(db, redis).delete(indicator_id)
    return Message(detail="Indicator deleted")
