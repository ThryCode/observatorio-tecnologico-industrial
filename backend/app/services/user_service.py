from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.services.base import BaseService
from app.services.query_helpers import apply_search


class UserService(BaseService[User, UserCreate, UserUpdate]):
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

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

        allowed_sorts = {
            "full_name": User.full_name,
            "email": User.email,
            "created_at": User.created_at,
            "role": User.role,
            "status": User.status,
        }
        return await self._paginate(count_query, query, page, per_page, sort_by, sort_order, allowed_sorts)
