from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.industrial_sector import (
    IndustrialSectorCreate,
    IndustrialSectorUpdate,
    IndustrialSectorResponse,
)
from app.schemas.common import PaginatedResponse, Message
from app.services.industrial_sector_service import IndustrialSectorService
from app.dependencies import get_db, get_current_superuser
from app.models.user import User

router = APIRouter(prefix="/industrial-sectors", tags=["industrial-sectors"])


@router.get("", response_model=PaginatedResponse[IndustrialSectorResponse])
async def list_sectors(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    items, total = await IndustrialSectorService(db).list(page, per_page)
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
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    return await IndustrialSectorService(db).create(data)


@router.put("/{codigo}", response_model=IndustrialSectorResponse)
async def update_sector(
    codigo: str,
    data: IndustrialSectorUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    return await IndustrialSectorService(db).update(codigo, data)


@router.delete("/{codigo}", response_model=Message)
async def delete_sector(
    codigo: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    await IndustrialSectorService(db).delete(codigo)
    return Message(detail="Industrial sector deleted")
