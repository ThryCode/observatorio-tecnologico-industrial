from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.professional import (
    ProfessionalListItem,
    ProfessionalProfileResponse,
    ProfessionalProfileUpdate,
)
from app.services.professional_profile_service import ProfessionalProfileService

router = APIRouter(prefix="/professionals", tags=["professionals"])


@router.get("", response_model=PaginatedResponse[ProfessionalListItem])
async def list_professionals(
    page: int = 1,
    per_page: int = 20,
    especialidad: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    service = ProfessionalProfileService(db)
    items, total = await service.list_professionals(page, per_page, especialidad)
    total_pages = max(1, (total + per_page - 1) // per_page)
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
    )


@router.get("/specialties")
async def list_specialties(db: AsyncSession = Depends(get_db)):
    specialties = await ProfessionalProfileService(db).list_specialties()
    return {"items": specialties}


@router.get("/me", response_model=ProfessionalProfileResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ProfessionalProfileService(db).get_my_profile(current_user.id)


@router.put("/me", response_model=ProfessionalProfileResponse)
async def update_my_profile(
    data: ProfessionalProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ProfessionalProfileService(db).update_my_profile(current_user.id, data)
