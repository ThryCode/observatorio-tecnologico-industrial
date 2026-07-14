from unittest.mock import AsyncMock, MagicMock

import pytest

from app.graph.repository import GraphRepository


@pytest.fixture
def mock_driver():
    driver = MagicMock()
    session_cm = AsyncMock()
    session = AsyncMock()
    session_cm.__aenter__.return_value = session
    session.run.return_value = AsyncMock()
    driver.session.return_value = session_cm
    return driver


@pytest.mark.asyncio
async def test_graph_stats_endpoint(client, superuser_token_headers):
    resp = await client.get("/api/v1/graph/stats", headers=superuser_token_headers)
    assert resp.status_code in (200, 503)


@pytest.mark.asyncio
async def test_graph_search_endpoint(client, superuser_token_headers):
    resp = await client.get("/api/v1/graph/search?q=test", headers=superuser_token_headers)
    assert resp.status_code in (200, 503)


@pytest.mark.asyncio
async def test_graph_explore_no_auth(client):
    resp = await client.get("/api/v1/graph/explore?node_id=abc&depth=2")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_graph_sync_no_auth(client):
    resp = await client.post("/api/v1/graph/sync")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_shortest_path_no_auth(client):
    resp = await client.get("/api/v1/graph/shortest-path?from=a&to=b")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_repository_stats(mock_driver):
    mock_driver.session.return_value.__aenter__.return_value.run.return_value.single = AsyncMock(return_value=None)
    repo = GraphRepository(mock_driver)
    result = await repo.stats()
    assert result == []


@pytest.mark.asyncio
async def test_repository_search(mock_driver):
    run_result = mock_driver.session.return_value.__aenter__.return_value.run.return_value
    run_result.single = AsyncMock(return_value={"total": 1})

    item = MagicMock()
    item.data.return_value = {"n": {"id": "1", "name": "Test"}, "node_labels": ["Test"]}
    run_result.__aiter__.return_value = iter([item])

    repo = GraphRepository(mock_driver)
    result = await repo.search_nodes("test", page=1, per_page=20)
    assert result["total"] == 1
    assert len(result["items"]) == 1
    assert result["items"][0]["n"]["name"] == "Test"


@pytest.mark.asyncio
async def test_repository_sync_apoc_fallback(mock_driver):
    mock_driver.session.return_value.__aenter__.return_value.run.side_effect = RuntimeError("Neo4j unavailable")
    repo = GraphRepository(mock_driver)
    apoc_ok = await repo._apoc_available()
    assert apoc_ok is False


@pytest.mark.asyncio
async def test_repository_explore_without_apoc(mock_driver):
    session = mock_driver.session.return_value.__aenter__.return_value
    fallback_result = AsyncMock()
    fallback_record = MagicMock()
    fallback_record.data.return_value = {"nodes": [], "relationships": []}
    fallback_result.single = AsyncMock(return_value=fallback_record)
    session.run.side_effect = [RuntimeError("APOC not available"), fallback_result]

    repo = GraphRepository(mock_driver)
    result = await repo.explore_node("test-id", 2)
    assert result is not None
    assert result["nodes"] == []
