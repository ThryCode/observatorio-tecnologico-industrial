from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import AppException
from app.dependencies import get_current_user, get_db
from app.models.professional_profile import ProfessionalProfile
from app.models.user import User, UserStatus
from app.schemas.common import PaginatedResponse
from app.schemas.professional import (
    ProfessionalListItem,
    ProfessionalProfileResponse,
    ProfessionalProfileUpdate,
)

router = APIRouter(prefix="/professionals", tags=["professionals"])


@router.get("", response_model=PaginatedResponse[ProfessionalListItem])
async def list_professionals(
    page: int = 1,
    per_page: int = 20,
    especialidad: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(User)
        .join(ProfessionalProfile, ProfessionalProfile.user_id == User.id)
        .where(User.status == UserStatus.APPROVED.value)
        .options(selectinload(User.professional_profile))
    )
    count_query = (
        select(func.count(User.id))
        .join(ProfessionalProfile, ProfessionalProfile.user_id == User.id)
        .where(User.status == UserStatus.APPROVED.value)
    )

    if especialidad:
        query = query.where(ProfessionalProfile.especialidad == especialidad)
        count_query = count_query.where(ProfessionalProfile.especialidad == especialidad)

    total = (await db.execute(count_query)).scalar() or 0
    offset = (page - 1) * per_page
    result = await db.execute(
        query.order_by(User.full_name).offset(offset).limit(per_page)
    )
    users = list(result.scalars().all())

    items = []
    for u in users:
        items.append(
            ProfessionalListItem(
                id=u.id,
                full_name=u.full_name,
                username=u.username,
                email=u.email,
                phone=u.phone,
                job_title=u.job_title,
                organization_id=u.organization_id,
                profile=u.professional_profile,
            )
        )

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
    result = await db.execute(
        select(ProfessionalProfile.especialidad).distinct().order_by(ProfessionalProfile.especialidad)
    )
    specialties = [row[0] for row in result.all()]
    return {"items": specialties}


@router.get("/me", response_model=ProfessionalProfileResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ProfessionalProfile).where(ProfessionalProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise AppException(404, "Professional profile not found")
    return profile


@router.put("/me", response_model=ProfessionalProfileResponse)
async def update_my_profile(
    data: ProfessionalProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ProfessionalProfile).where(ProfessionalProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise AppException(404, "Professional profile not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(profile, key, val)
    await db.flush()
    await db.refresh(profile)
    return profile
