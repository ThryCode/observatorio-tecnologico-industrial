from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.dependencies import get_current_user, get_db, require_role
from app.models.user import User
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
    mine: bool | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    author_name = current_user.full_name if mine else None
    items, total = await ResearchPublicationService(db).list(
        page, per_page, sector_codigo, q, fecha_desde, fecha_hasta,
        sort_by, sort_order, author_name,
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
    current_user: User = Depends(require_role("admin_mindus", "profesional")),
):
    pub = await ResearchPublicationService(db).create(data)
    pub.created_by = current_user.id
    await db.flush()
    await db.refresh(pub)
    return pub


@router.put("/{pub_id}", response_model=ResearchPublicationResponse)
async def update_research_publication(
    pub_id: UUID,
    data: ResearchPublicationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin_mindus", "profesional")),
):
    service = ResearchPublicationService(db)
    pub = await service.get(pub_id)
    is_author = current_user.full_name.lower() in (pub.autores or "").lower()
    if pub.created_by != current_user.id and not is_author and current_user.role != "admin_mindus":
        raise AppException(403, "No tienes permiso para editar esta publicación")
    return await service.update(pub_id, data)


@router.delete("/{pub_id}", response_model=Message)
async def delete_research_publication(
    pub_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin_mindus", "profesional")),
):
    service = ResearchPublicationService(db)
    pub = await service.get(pub_id)
    is_author = current_user.full_name.lower() in (pub.autores or "").lower()
    if pub.created_by != current_user.id and not is_author and current_user.role != "admin_mindus":
        raise AppException(403, "No tienes permiso para eliminar esta publicación")
    await service.delete(pub_id)
    return Message(detail="Research publication deleted")
