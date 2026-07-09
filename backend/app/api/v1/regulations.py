from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.schemas.regulation import RegulationCreate, RegulationUpdate, RegulationResponse
from app.schemas.common import PaginatedResponse, Message
from app.services.regulation_service import RegulationService
from app.dependencies import get_db, get_current_user, get_current_superuser
from app.models.user import User

router = APIRouter(prefix="/regulations", tags=["regulations"])


@router.get("", response_model=PaginatedResponse[RegulationResponse])
async def list_regulations(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    category: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    items, total = await RegulationService(db).list(page, per_page, category)
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=(total + per_page - 1) // per_page,
    )


@router.get("/{regulation_id}", response_model=RegulationResponse)
async def get_regulation(regulation_id: UUID, db: AsyncSession = Depends(get_db)):
    return await RegulationService(db).get(regulation_id)


@router.post("", response_model=RegulationResponse, status_code=201)
async def create_regulation(
    data: RegulationCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await RegulationService(db).create(data)


@router.put("/{regulation_id}", response_model=RegulationResponse)
async def update_regulation(
    regulation_id: UUID,
    data: RegulationUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await RegulationService(db).update(regulation_id, data)


@router.delete("/{regulation_id}", response_model=Message)
async def delete_regulation(
    regulation_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    await RegulationService(db).delete(regulation_id)
    return Message(detail="Regulation deleted")
