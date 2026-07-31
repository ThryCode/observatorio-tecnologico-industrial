from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, require_role
from app.models.user import User, UserRole
from app.schemas.common import Message, PaginatedResponse
from app.schemas.research_publication import (
    ResearchPublicationCreate,
    ResearchPublicationResponse,
    ResearchPublicationUpdate,
)
from app.services.research_publication_service import ResearchPublicationService

router = APIRouter(
    prefix="/research-publications", tags=["research-publications"]
)


@router.get("", response_model=PaginatedResponse[ResearchPublicationResponse])
async def list_research_publications(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sector_codigo: str | None = Query(None),
    q: str | None = Query(None),
    fecha_desde: str | None = Query(None),
    fecha_hasta: str | None = Query(None),
    sort_by: str | None = Query(None),
    sort_order: str = Query("desc"),
    db: AsyncSession = Depends(get_db),
):
    items, total = await ResearchPublicationService(db).list(
        page, per_page, sector_codigo, q, fecha_desde, fecha_hasta,
        sort_by, sort_order,
    )
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=(total + per_page - 1) // per_page,
    )


@router.get("/{pub_id}", response_model=ResearchPublicationResponse)
async def get_research_publication(
    pub_id: UUID, db: AsyncSession = Depends(get_db)
):
    return await ResearchPublicationService(db).get(pub_id)


@router.post("", response_model=ResearchPublicationResponse, status_code=201)
async def create_research_publication(
    data: ResearchPublicationCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN_MINDUS, UserRole.PROFESIONAL)),
):
    return await ResearchPublicationService(db).create(data)


@router.put("/{pub_id}", response_model=ResearchPublicationResponse)
async def update_research_publication(
    pub_id: UUID,
    data: ResearchPublicationUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN_MINDUS)),
):
    return await ResearchPublicationService(db).update(pub_id, data)


@router.delete("/{pub_id}", response_model=Message)
async def delete_research_publication(
    pub_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN_MINDUS)),
):
    await ResearchPublicationService(db).delete(pub_id)
    return Message(detail="Research publication deleted")
