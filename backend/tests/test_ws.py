import asyncio
import uuid
from unittest.mock import patch

import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool
from starlette.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from app.core.security import create_access_token
from app.main import app
from app.models.base import Base
from app.models.user import User


@pytest.fixture
def ws_engine(tmp_path):
    db_path = tmp_path / "test_ws.db"
    url = f"sqlite+aiosqlite:///{db_path}"
    engine = create_async_engine(url, poolclass=NullPool)

    async def _init():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    asyncio.get_event_loop().run_until_complete(_init())
    yield engine
    asyncio.get_event_loop().run_until_complete(engine.dispose())


def _patch_factory(engine):
    factory = async_sessionmaker(engine, expire_on_commit=False)
    return patch("app.api.v1.ws._session_factory", factory)


def _create_user(engine, *, status="approved", is_active=True):
    factory = async_sessionmaker(engine, expire_on_commit=False)
    user_id = uuid.uuid4()

    async def _insert():
        async with factory() as session:
            user = User(
                username=f"ws_test_{user_id.hex[:8]}",
                email=f"ws_test_{user_id.hex[:8]}@test.com",
                full_name="WS Test User",
                hashed_password="x",
                status=status,
                is_active=is_active,
            )
            session.add(user)
            await session.commit()

    asyncio.get_event_loop().run_until_complete(_insert())
    return str(user_id)


def _ws_connect(client, ws_engine, path):
    return _patch_factory(ws_engine), client.websocket_connect(path)


def test_websocket_connect_valid_token(ws_engine):
    """Token via query param, real user in DB -> connection stays open."""
    user_id = _create_user(ws_engine)
    token = create_access_token({"sub": user_id})
    client = TestClient(app)
    with _patch_factory(ws_engine), client.websocket_connect(
        f"/api/v1/ws?token={token}"
    ) as ws:
        ws.send_text("ping")


def test_websocket_connect_no_token(ws_engine):
    """No token query param -> close 4001."""
    client = TestClient(app)
    with _patch_factory(ws_engine), client.websocket_connect(
        "/api/v1/ws"
    ) as ws, pytest.raises(WebSocketDisconnect) as exc:
        ws.receive_text()
    assert exc.value.code == 4001


def test_websocket_connect_invalid_token(ws_engine):
    """Invalid JWT in query param -> close 4001."""
    client = TestClient(app)
    with _patch_factory(ws_engine), client.websocket_connect(
        "/api/v1/ws?token=bad-token"
    ) as ws, pytest.raises(WebSocketDisconnect) as exc:
        ws.receive_text()
    assert exc.value.code == 4001


def test_websocket_connect_nonexistent_user(ws_engine):
    """Valid JWT but user not in DB -> close 4001."""
    token = create_access_token({"sub": str(uuid.uuid4())})
    client = TestClient(app)
    with _patch_factory(ws_engine), client.websocket_connect(
        f"/api/v1/ws?token={token}"
    ) as ws, pytest.raises(WebSocketDisconnect) as exc:
        ws.receive_text()
    assert exc.value.code == 4001


def test_websocket_connect_inactive_user(ws_engine):
    """Valid JWT but user.is_active=False -> close 4001."""
    user_id = _create_user(ws_engine, is_active=False)
    token = create_access_token({"sub": user_id})
    client = TestClient(app)
    with _patch_factory(ws_engine), client.websocket_connect(
        f"/api/v1/ws?token={token}"
    ) as ws, pytest.raises(WebSocketDisconnect) as exc:
        ws.receive_text()
    assert exc.value.code == 4001


def test_websocket_connect_pending_user(ws_engine):
    """Valid JWT but user.status='pending' -> close 4001."""
    user_id = _create_user(ws_engine, status="pending")
    token = create_access_token({"sub": user_id})
    client = TestClient(app)
    with _patch_factory(ws_engine), client.websocket_connect(
        f"/api/v1/ws?token={token}"
    ) as ws, pytest.raises(WebSocketDisconnect) as exc:
        ws.receive_text()
    assert exc.value.code == 4001
