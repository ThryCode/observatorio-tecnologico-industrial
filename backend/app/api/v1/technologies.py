from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.schemas.technology import TechnologyCreate, TechnologyUpdate, TechnologyResponse
from app.schemas.common import PaginatedResponse, Message
from app.services.technology_service import TechnologyService
from app.dependencies import get_db, get_current_user, get_current_superuser
from app.models.user import User

router = APIRouter(prefix="/technologies", tags=["technologies"])


@router.get("", response_model=PaginatedResponse[TechnologyResponse])
async def list_technologies(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sector_codigo: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    items, total = await TechnologyService(db).list(page, per_page, sector_codigo)
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=(total + per_page - 1) // per_page,
    )


@router.get("/{tech_id}", response_model=TechnologyResponse)
async def get_technology(tech_id: UUID, db: AsyncSession = Depends(get_db)):
    return await TechnologyService(db).get(tech_id)


@router.post("", response_model=TechnologyResponse, status_code=201)
async def create_technology(
    data: TechnologyCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await TechnologyService(db).create(data)


@router.put("/{tech_id}", response_model=TechnologyResponse)
async def update_technology(
    tech_id: UUID,
    data: TechnologyUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await TechnologyService(db).update(tech_id, data)


@router.delete("/{tech_id}", response_model=Message)
async def delete_technology(
    tech_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    await TechnologyService(db).delete(tech_id)
    return Message(detail="Technology deleted")
