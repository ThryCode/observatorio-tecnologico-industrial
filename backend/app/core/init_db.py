import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User, UserRole

logger = logging.getLogger(__name__)


async def init_db(session: AsyncSession) -> None:
    await create_superuser_if_not_exists(session)


async def create_superuser_if_not_exists(session: AsyncSession) -> None:
    result = await session.execute(
        select(User).where(User.role == UserRole.ADMIN_MINDUS).limit(1)
    )
    existing_admin = result.scalar_one_or_none()

    if existing_admin:
        logger.info(f"Superuser already exists: {existing_admin.email}")
        return

    superuser = User(
        username=settings.first_superuser,
        email=f"{settings.first_superuser}@mindus.gob.cu",
        hashed_password=get_password_hash(settings.first_superuser_password),
        full_name="Administrador MINDUS",
        role=UserRole.ADMIN_MINDUS,
        is_superuser=True,
        is_active=True,
    )

    session.add(superuser)
    await session.commit()
    logger.info(f"Superuser created: {superuser.email}")
