from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.schemas.auth import LoginRequest
from app.schemas.user import UserCreate


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, data: UserCreate) -> User:
        result = await self.db.execute(
            select(User).where((User.username == data.username) | (User.email == data.email))
        )
        if result.scalar_one_or_none():
            raise AppException(409, "Username or email already exists")
        user = User(
            username=data.username,
            email=data.email,
            hashed_password=get_password_hash(data.password),
            full_name=data.full_name,
            role="visitante",
        )
        self.db.add(user)
        await self.db.flush()
        return user

    async def authenticate(self, data: LoginRequest) -> str:
        result = await self.db.execute(
            select(User).where(
                or_(
                    User.username == data.username,
                    User.email == data.username,
                )
            )
        )
        user = result.scalar_one_or_none()
        if not user or not verify_password(data.password, user.hashed_password):
            raise AppException(401, "Invalid credentials")
        if not user.is_active:
            raise AppException(403, "Account is disabled")
        return create_access_token({"sub": str(user.id)})
