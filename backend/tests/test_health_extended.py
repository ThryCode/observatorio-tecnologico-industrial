import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "services" in data
    assert "postgresql" in data["services"]
    assert "neo4j" in data["services"]
    assert "redis" in data["services"]


@pytest.mark.asyncio
async def test_liveness_check(client):
    response = await client.get("/api/v1/health/live")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "alive"


@pytest.mark.asyncio
async def test_readiness_check(client):
    response = await client.get("/api/v1/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "checks" in data
    assert "postgresql" in data["checks"]


@pytest.mark.asyncio
async def test_health_check_degraded():
    from app.main import app
    from fastapi.testclient import TestClient

    async def mock_get_db():
        mock_session = AsyncMock()
        mock_session.execute = AsyncMock(side_effect=Exception("DB Error"))
        yield mock_session

    async def mock_get_neo4j():
        return None

    async def mock_get_redis():
        return None

    app.dependency_overrides.clear()

    from app.core.db import get_db
    from app.dependencies import get_neo4j, get_redis
    app.dependency_overrides[get_db] = mock_get_db
    app.dependency_overrides[get_neo4j] = mock_get_neo4j
    app.dependency_overrides[get_redis] = mock_get_redis

    with TestClient(app) as client:
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "degraded"
        assert data["services"]["postgresql"]["status"] == "error"

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_readiness_check_not_ready(client, db_session):
    from app.main import app
    from app.core.db import get_db
    from app.dependencies import get_neo4j, get_redis
    from unittest.mock import AsyncMock

    async def mock_get_db():
        mock_session = AsyncMock()
        mock_session.execute = AsyncMock(side_effect=Exception("DB Error"))
        yield mock_session

    async def mock_get_neo4j():
        return None

    async def mock_get_redis():
        return None

    app.dependency_overrides[get_db] = mock_get_db
    app.dependency_overrides[get_neo4j] = mock_get_neo4j
    app.dependency_overrides[get_redis] = mock_get_redis

    response = await client.get("/api/v1/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "not ready"

    app.dependency_overrides.clear()
