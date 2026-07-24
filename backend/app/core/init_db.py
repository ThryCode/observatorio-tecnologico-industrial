from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User, UserRole, UserStatus


async def init_db(session: AsyncSession) -> None:
    await create_superuser_if_not_exists(session)

    from app.core.seed_data import seed_all

    await seed_all(session)


async def create_superuser_if_not_exists(session: AsyncSession) -> None:
    result = await session.execute(
        select(User).where(User.role == UserRole.ADMIN_MINDUS).limit(1)
    )
    existing_admin = result.scalar_one_or_none()

    if existing_admin:
        logger.info(f"Superuser already exists: {existing_admin.email}")
        return

    raw = settings.first_superuser
    email = raw if "@" in raw else f"{raw}@mindus.gob.cu"
    superuser = User(
        username=raw,
        email=email,
        hashed_password=get_password_hash(settings.first_superuser_password),
        full_name="Administrador MINDUS",
        role=UserRole.ADMIN_MINDUS,
        is_superuser=True,
        is_active=True,
        status=UserStatus.APPROVED.value,
    )

    session.add(superuser)
    await session.flush()
    logger.info(f"Superuser created: {superuser.email}")
