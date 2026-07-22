from datetime import UTC, datetime

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.organization import Organization
from app.models.user import User, UserStatus
from app.schemas.auth import LoginRequest, RegisterRequest
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

    async def register_public(self, data: RegisterRequest) -> None:
        result = await self.db.execute(
            select(User).where((User.username == data.username) | (User.email == data.email))
        )
        if result.scalar_one_or_none():
            raise AppException(409, "Username or email already exists")

        org_id = data.organization_id

        if not org_id and data.new_organization_name:
            org = Organization(
                nombre=data.new_organization_name,
                siglas=data.new_organization_siglas or data.new_organization_name[:20],
                tipo="empresa",
                sector_codigo=data.sector_codigo,
            )
            self.db.add(org)
            await self.db.flush()
            org_id = org.id

        user = User(
            username=data.username,
            email=data.email,
            hashed_password=get_password_hash(data.password),
            full_name=data.full_name,
            phone=data.phone,
            job_title=data.job_title,
            organization_id=org_id,
            account_type=data.account_type,
            status=UserStatus.PENDING.value,
            role="visitante",
        )
        self.db.add(user)
        await self.db.flush()

    async def authenticate(self, data: LoginRequest) -> str:
        username = data.username.lower()
        result = await self.db.execute(
            select(User).where(
                or_(
                    User.username == username,
                    User.email == username,
                )
            )
        )
        user = result.scalar_one_or_none()
        if not user or not verify_password(data.password, user.hashed_password):
            raise AppException(401, "Invalid credentials")
        if not user.is_active:
            raise AppException(403, "Account is disabled")
        if user.status == UserStatus.PENDING.value:
            raise AppException(403, "Account pending approval. Contact an administrator.")
        if user.status == UserStatus.REJECTED.value:
            reason = user.rejection_reason or "Registration was rejected"
            raise AppException(403, f"Account rejected: {reason}")
        return create_access_token({"sub": str(user.id)})

    async def approve_user(self, user_id: str, admin_id: str) -> User:
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise AppException(404, "User not found")
        if user.status != UserStatus.PENDING.value:
            raise AppException(400, "User is not pending approval")
        user.status = UserStatus.APPROVED.value
        user.approved_by = admin_id
        user.approved_at = datetime.now(UTC)
        user.is_active = True
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def reject_user(self, user_id: str, reason: str) -> User:
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise AppException(404, "User not found")
        if user.status != UserStatus.PENDING.value:
            raise AppException(400, "User is not pending approval")
        user.status = UserStatus.REJECTED.value
        user.rejection_reason = reason
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def list_pending(self) -> list[User]:
        result = await self.db.execute(
            select(User)
            .where(User.status == UserStatus.PENDING.value)
            .order_by(User.created_at.desc())
        )
        return list(result.scalars().all())
