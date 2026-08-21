import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User, UserStatus

logger = structlog.stdlib.get_logger()


async def init_db(session: AsyncSession) -> None:
    await create_superuser_if_not_exists(session)

    from app.core.seed_data import seed_all

    await seed_all(session)


async def create_superuser_if_not_exists(session: AsyncSession) -> None:
    result = await session.execute(
        select(User).where(User.role == "admin_mindus").limit(1)
    )
    existing_admin = result.scalar_one_or_none()

    if existing_admin:
        if existing_admin.status == UserStatus.PENDING.value:
            existing_admin.status = UserStatus.APPROVED.value
            await session.flush()
            logger.info("superuser_status_updated", email=existing_admin.email)
        else:
            logger.info("superuser_exists", email=existing_admin.email)
        return

    raw = settings.first_superuser
    if "@" in raw:
        email = raw
        username = raw.split("@")[0]
    else:
        email = f"{raw}@mindus.gob.cu"
        username = raw
    superuser = User(
        username=username,
        email=email,
        hashed_password=get_password_hash(settings.first_superuser_password),
        full_name="Administrador MINDUS",
        role="admin_mindus",
        is_superuser=True,
        is_active=True,
        status=UserStatus.APPROVED.value,
    )

    session.add(superuser)
    await session.flush()
    logger.info("superuser_created", email=superuser.email)
