from uuid import UUID

from sqlalchemy import asc, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import AppException
from app.models.professional_profile import ProfessionalProfile
from app.models.user import User, UserStatus
from app.schemas.professional import ProfessionalListItem, ProfessionalProfileUpdate


class ProfessionalProfileService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_professionals(
        self, page: int, per_page: int, especialidad: str | None = None,
        q: str | None = None, sort_by: str | None = None, sort_order: str = "desc"
    ) -> tuple[list[ProfessionalListItem], int]:
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
        if q:
            like = f"%{q}%"
            cond = User.full_name.ilike(like) | User.email.ilike(like)
            query = query.where(cond)
            count_query = count_query.where(cond)

        total = (await self.db.execute(count_query)).scalar() or 0
        offset = (page - 1) * per_page

        if sort_by == "email":
            order_col = User.email
        elif sort_by == "especialidad":
            order_col = ProfessionalProfile.especialidad
        else:
            order_col = User.full_name
        sort_fn = asc if sort_order == "asc" else desc
        result = await self.db.execute(
            query.order_by(sort_fn(order_col)).offset(offset).limit(per_page)
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

        return items, total

    async def list_specialties(self) -> list[str]:
        result = await self.db.execute(
            select(ProfessionalProfile.especialidad)
            .distinct()
            .order_by(ProfessionalProfile.especialidad)
        )
        return [row[0] for row in result.all()]

    async def get_my_profile(self, user_id: UUID) -> ProfessionalProfile:
        result = await self.db.execute(
            select(ProfessionalProfile).where(ProfessionalProfile.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise AppException(404, "Professional profile not found")
        return profile

    async def update_my_profile(
        self, user_id: UUID, data: ProfessionalProfileUpdate
    ) -> ProfessionalProfile:
        result = await self.db.execute(
            select(ProfessionalProfile).where(ProfessionalProfile.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise AppException(404, "Professional profile not found")
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(profile, key, val)
        await self.db.flush()
        await self.db.refresh(profile)
        return profile
