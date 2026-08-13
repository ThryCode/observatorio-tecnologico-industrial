from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, require_role
from app.models.user import User
from app.schemas.bulletin import BulletinCreate, BulletinResponse, BulletinUpdate
from app.schemas.common import Message, PaginatedResponse
from app.services.bulletin_service import BulletinService

router = APIRouter(prefix="/bulletins", tags=["bulletins"])


@router.get("", response_model=PaginatedResponse[BulletinResponse])
async def list_bulletins(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sector_codigo: str | None = Query(None),
    categoria: str | None = Query(None),
    q: str | None = Query(None),
    fecha_desde: date | None = Query(None),
    fecha_hasta: date | None = Query(None),
    sort_by: str | None = Query(None),
    sort_order: str = Query("desc"),
    db: AsyncSession = Depends(get_db),
):
    items, total = await BulletinService(db).list(
        page, per_page, sector_codigo, categoria, q, fecha_desde, fecha_hasta, sort_by, sort_order,
    )
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=(total + per_page - 1) // per_page,
    )


@router.get("/{bulletin_id}", response_model=BulletinResponse)
async def get_bulletin(bulletin_id: UUID, db: AsyncSession = Depends(get_db)):
    return await BulletinService(db).get(bulletin_id)


@router.post("", response_model=BulletinResponse, status_code=201)
async def create_bulletin(
    data: BulletinCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin_mindus")),
):
    return await BulletinService(db).create(data)


@router.put("/{bulletin_id}", response_model=BulletinResponse)
async def update_bulletin(
    bulletin_id: UUID,
    data: BulletinUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin_mindus")),
):
    return await BulletinService(db).update(bulletin_id, data)


@router.delete("/{bulletin_id}", response_model=Message)
async def delete_bulletin(
    bulletin_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin_mindus")),
):
    await BulletinService(db).delete(bulletin_id)
    return Message(detail="Bulletin deleted")
