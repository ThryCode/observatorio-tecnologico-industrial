from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_superuser, get_current_user, get_db
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
    db: AsyncSession = Depends(get_db),
):
    items, total = await PatentService(db).list(page, per_page, sector, status, q)
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=(total + per_page - 1) // per_page,
    )


@router.get("/{patent_id}", response_model=PatentResponse)
async def get_patent(patent_id: UUID, db: AsyncSession = Depends(get_db)):
    return await PatentService(db).get(patent_id)


@router.post("", response_model=PatentResponse, status_code=201)
async def create_patent(
    data: PatentCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await PatentService(db).create(data)


@router.put("/{patent_id}", response_model=PatentResponse)
async def update_patent(
    patent_id: UUID,
    data: PatentUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await PatentService(db).update(patent_id, data)


@router.delete("/{patent_id}", response_model=Message)
async def delete_patent(
    patent_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    await PatentService(db).delete(patent_id)
    return Message(detail="Patent deleted")
