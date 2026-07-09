from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.user import UserUpdate
from app.core.exceptions import AppException


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, page: int, per_page: int):
        total = (await self.db.execute(select(func.count(User.id)))).scalar()
        offset = (page - 1) * per_page
        result = await self.db.execute(select(User).offset(offset).limit(per_page))
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
        return user

    async def delete(self, user_id: UUID) -> None:
        user = await self.get(user_id)
        await self.db.delete(user)
        await self.db.flush()
