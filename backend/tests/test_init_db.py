import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.init_db import init_db, create_superuser_if_not_exists
from app.models.user import User, UserRole, UserStatus


@pytest.mark.asyncio
async def test_create_superuser_creates_new(db_session):
    from app.core.config import settings
    settings.first_superuser = "admin"
    settings.first_superuser_password = "testpass123"

    await create_superuser_if_not_exists(db_session)

    result = await db_session.execute(
        __import__('sqlalchemy').select(User).where(User.role == UserRole.ADMIN_MINDUS)
    )
    user = result.scalar_one_or_none()
    assert user is not None
    assert user.username == "admin"
    assert user.status == UserStatus.APPROVED.value


@pytest.mark.asyncio
async def test_create_superuser_existing_approved(db_session):
    user = User(
        username="existing", email="existing@test.com",
        full_name="Admin", hashed_password="x",
        role=UserRole.ADMIN_MINDUS, is_superuser=True,
        status=UserStatus.APPROVED.value,
    )
    db_session.add(user)
    await db_session.commit()

    await create_superuser_if_not_exists(db_session)

    result = await db_session.execute(
        __import__('sqlalchemy').select(User).where(User.role == UserRole.ADMIN_MINDUS)
    )
    users = result.scalars().all()
    assert len(users) == 1


@pytest.mark.asyncio
async def test_create_superuser_existing_pending(db_session):
    user = User(
        username="pending_admin", email="pending@test.com",
        full_name="Pending Admin", hashed_password="x",
        role=UserRole.ADMIN_MINDUS, is_superuser=True,
        status=UserStatus.PENDING.value,
    )
    db_session.add(user)
    await db_session.commit()

    await create_superuser_if_not_exists(db_session)

    result = await db_session.execute(
        __import__('sqlalchemy').select(User).where(User.username == "pending_admin")
    )
    updated = result.scalar_one_or_none()
    assert updated.status == UserStatus.APPROVED.value


@pytest.mark.asyncio
async def test_create_superuser_email_format(db_session):
    from app.core.config import settings
    settings.first_superuser = "admin@mindus.gob.cu"
    settings.first_superuser_password = "testpass123"

    await create_superuser_if_not_exists(db_session)

    result = await db_session.execute(
        __import__('sqlalchemy').select(User).where(User.role == UserRole.ADMIN_MINDUS)
    )
    user = result.scalar_one_or_none()
    assert user.email == "admin@mindus.gob.cu"
    assert user.username == "admin"
