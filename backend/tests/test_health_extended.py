from unittest.mock import AsyncMock, patch

import pytest


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
    from fastapi.testclient import TestClient

    from app.main import app

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

    with patch("app.main.startup_db", new_callable=AsyncMock), \
         patch("app.main.close_db", new_callable=AsyncMock), \
         patch("app.neo4j_client.create_neo4j_driver", return_value=None), \
         patch("app.redis_client.create_redis_client", return_value=None), TestClient(app) as client:
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "degraded"
        assert data["services"]["postgresql"]["status"] == "error"

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_readiness_check_not_ready(client, db_session):
    from unittest.mock import AsyncMock

    from app.core.db import get_db
    from app.dependencies import get_neo4j, get_redis
    from app.main import app

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
