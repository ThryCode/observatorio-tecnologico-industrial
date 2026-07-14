"""Smoke tests for graph endpoints (require running Neo4j)."""

import pytest


@pytest.mark.asyncio
async def test_graph_stats(client, superuser_token_headers):
    response = await client.get("/api/v1/graph/stats", headers=superuser_token_headers)
    assert response.status_code in (200, 503)


@pytest.mark.asyncio
async def test_graph_search(client, superuser_token_headers):
    response = await client.get("/api/v1/graph/search?q=test", headers=superuser_token_headers)
    assert response.status_code in (200, 503)
