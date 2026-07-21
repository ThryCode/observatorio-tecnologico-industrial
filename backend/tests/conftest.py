import os

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import update
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

os.environ["TESTING"] = "1"

from app.core.security import get_password_hash
from app.dependencies import get_db
from app.main import app
from app.models.base import Base
from app.models.user import User

TEST_DATABASE_URL = "postgresql+asyncpg://observatorio:observatorio_dev@localhost:5432/observatorio_test"


@pytest_asyncio.fixture(scope="session")
async def engine():
    engine = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(engine):
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session


@pytest_asyncio.fixture
async def client(db_session):
    app.dependency_overrides[get_db] = lambda: db_session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def superuser_token_headers(client, db_session):
    user = User(
        username="testsuperuser",
        email="super@test.com",
        hashed_password=get_password_hash("secret123"),
        full_name="Test Super User",
        role="admin_mindus",
        is_superuser=True,
    )
    db_session.add(user)
    await db_session.flush()
    login = await client.post("/api/v1/auth/login", json={
        "username": "testsuperuser",
        "password": "secret123",
    })
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers(client, db_session, superuser_token_headers):
    async def _make(username: str, is_superuser: bool = False):
        await client.post("/api/v1/auth/register", json={
            "username": username,
            "email": f"{username}@test.com",
            "password": "secret123",
            "full_name": "Test User",
        }, headers=superuser_token_headers)
        if is_superuser:
            await db_session.execute(
                update(User).where(User.username == username).values(is_superuser=True)
            )
            await db_session.flush()
        login = await client.post("/api/v1/auth/login", json={
            "username": username,
            "password": "secret123",
        })
        token = login.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    return _make
