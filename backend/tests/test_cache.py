import json
from unittest.mock import AsyncMock

import pytest

from app.services.cache import cache_key, get_cached, invalidate_pattern, set_cached


@pytest.mark.asyncio
async def test_get_cached_none_redis():
    result = await get_cached(None, "key")
    assert result is None


@pytest.mark.asyncio
async def test_get_cached_miss():
    mock_redis = AsyncMock()
    mock_redis.get = AsyncMock(return_value=None)

    result = await get_cached(mock_redis, "key")
    assert result is None


@pytest.mark.asyncio
async def test_get_cached_hit():
    mock_redis = AsyncMock()
    data = {"foo": "bar"}
    mock_redis.get = AsyncMock(return_value=json.dumps(data).encode())

    result = await get_cached(mock_redis, "key")
    assert result == data


@pytest.mark.asyncio
async def test_set_cached_none_redis():
    await set_cached(None, "key", {"foo": "bar"})


@pytest.mark.asyncio
async def test_set_cached():
    mock_redis = AsyncMock()
    mock_redis.setex = AsyncMock()

    await set_cached(mock_redis, "key", {"foo": "bar"}, ttl=60)
    mock_redis.setex.assert_called_once()


@pytest.mark.asyncio
async def test_invalidate_pattern_none_redis():
    await invalidate_pattern(None, "pattern:*")


@pytest.mark.asyncio
async def test_invalidate_pattern():
    mock_redis = AsyncMock()
    mock_redis.keys = AsyncMock(return_value=["key1", "key2"])
    mock_redis.delete = AsyncMock()

    await invalidate_pattern(mock_redis, "pattern:*")
    mock_redis.delete.assert_called_once_with("key1", "key2")


@pytest.mark.asyncio
async def test_invalidate_pattern_no_keys():
    mock_redis = AsyncMock()
    mock_redis.keys = AsyncMock(return_value=[])
    mock_redis.delete = AsyncMock()

    await invalidate_pattern(mock_redis, "pattern:*")
    mock_redis.delete.assert_not_called()


def test_cache_key_basic():
    key = cache_key("prefix", "arg1", "arg2")
    assert key == "prefix:arg1:arg2"


def test_cache_key_kwargs():
    key = cache_key("prefix", foo="bar", baz="qux")
    assert "foo=bar" in key
    assert "baz=qux" in key


def test_cache_key_sorted():
    key = cache_key("prefix", z="1", a="2")
    assert key == "prefix:a=2:z=1"
