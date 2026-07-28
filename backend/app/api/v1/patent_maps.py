from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db, require_role
from app.models.user import User, UserRole
from app.schemas.common import Message
from app.schemas.patent_map import PatentMapCreate, PatentMapResponse, PatentMapUpdate
from app.services.patent_map_service import PatentMapService

router = APIRouter(prefix="/patent-maps", tags=["patent-maps"])


@router.get("/summary", response_model=list[PatentMapResponse])
async def get_patent_map_summary(
    pais: str | None = Query(None),
    sector_codigo: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await PatentMapService(db).summary(pais, sector_codigo)


@router.get("/{entry_id}", response_model=PatentMapResponse)
async def get_patent_map_entry(entry_id: UUID, db: AsyncSession = Depends(get_db)):
    return await PatentMapService(db).get(entry_id)


@router.post("", response_model=PatentMapResponse, status_code=201)
async def create_patent_map_entry(
    data: PatentMapCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await PatentMapService(db).create(data)


@router.put("/{entry_id}", response_model=PatentMapResponse)
async def update_patent_map_entry(
    entry_id: UUID,
    data: PatentMapUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await PatentMapService(db).update(entry_id, data)


@router.delete("/{entry_id}", response_model=Message)
async def delete_patent_map_entry(
    entry_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN_MINDUS)),
):
    await PatentMapService(db).delete(entry_id)
    return Message(detail="Patent map entry deleted")
