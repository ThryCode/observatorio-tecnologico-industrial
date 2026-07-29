from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.models.user import User
from app.schemas.user import UserUpdate
from app.services.query_helpers import apply_search, apply_sorting


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, page: int, per_page: int, q: str | None = None,
                   role: str | None = None, status: str | None = None,
                   is_active: bool | None = None,
                   sort_by: str | None = None, sort_order: str = "desc") -> tuple[list[User], int]:
        query = select(User)
        count_query = select(func.count(User.id))

        if q:
            query = apply_search(query, User, q, [User.full_name, User.email, User.username])
            count_query = apply_search(count_query, User, q, [User.full_name, User.email, User.username])
        if role:
            query = query.where(User.role == role)
            count_query = count_query.where(User.role == role)
        if status:
            query = query.where(User.status == status)
            count_query = count_query.where(User.status == status)
        if is_active is not None:
            query = query.where(User.is_active == is_active)
            count_query = count_query.where(User.is_active == is_active)

        total = (await self.db.execute(count_query)).scalar()
        offset = (page - 1) * per_page

        allowed_sorts = {
            "full_name": User.full_name,
            "email": User.email,
            "created_at": User.created_at,
            "role": User.role,
            "status": User.status,
        }
        query = apply_sorting(query, User, sort_by, sort_order, allowed_sorts)
        if not sort_by:
            query = query.order_by(User.created_at.desc())

        result = await self.db.execute(
            query.offset(offset).limit(per_page)
        )
        items = result.scalars().all()
        return items, total

    async def get(self, user_id: UUID) -> User:
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise AppException(404, "User not found")
        return user

    async def update(self, user_id: UUID, data: UserUpdate) -> User:
        user = await self.get(user_id)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(user, key, val)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def delete(self, user_id: UUID) -> None:
        user = await self.get(user_id)
        await self.db.delete(user)
        await self.db.flush()
