from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.schemas.indicator import IndicatorCreate, IndicatorUpdate, IndicatorResponse
from app.schemas.common import PaginatedResponse, Message
from app.services.indicator_service import IndicatorService
from app.dependencies import get_db, get_current_user, get_current_superuser
from app.models.user import User

router = APIRouter(prefix="/indicators", tags=["indicators"])


@router.get("", response_model=PaginatedResponse[IndicatorResponse])
async def list_indicators(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sector: str | None = Query(None),
    period: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    items, total = await IndicatorService(db).list(page, per_page, sector, period)
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=(total + per_page - 1) // per_page,
    )


@router.get("/{indicator_id}", response_model=IndicatorResponse)
async def get_indicator(indicator_id: UUID, db: AsyncSession = Depends(get_db)):
    return await IndicatorService(db).get(indicator_id)


@router.post("", response_model=IndicatorResponse, status_code=201)
async def create_indicator(
    data: IndicatorCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await IndicatorService(db).create(data)


@router.put("/{indicator_id}", response_model=IndicatorResponse)
async def update_indicator(
    indicator_id: UUID,
    data: IndicatorUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await IndicatorService(db).update(indicator_id, data)


@router.delete("/{indicator_id}", response_model=Message)
async def delete_indicator(
    indicator_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    await IndicatorService(db).delete(indicator_id)
    return Message(detail="Indicator deleted")
