from __future__ import annotations

import json
from contextlib import suppress
from typing import Any

from redis.asyncio import Redis


async def get_cached(redis: Redis | None, key: str) -> Any | None:
    if redis is None:
        return None
    try:
        data = await redis.get(key)
    except Exception:
        return None
    if data is None:
        return None
    return json.loads(data)


async def set_cached(redis: Redis | None, key: str, value: Any, ttl: int = 300) -> None:
    if redis is None:
        return
    with suppress(Exception):
        await redis.setex(key, ttl, json.dumps(value, default=str))


async def invalidate_pattern(redis: Redis | None, pattern: str) -> None:
    if redis is None:
        return
    try:
        keys = await redis.keys(pattern)
        if keys:
            await redis.delete(*keys)
    except Exception:
        pass


def cache_key(prefix: str, *args, **kwargs) -> str:
    parts = [prefix]
    parts.extend(str(a) for a in args)
    for k, v in sorted(kwargs.items()):
        parts.append(f"{k}={v}")
    return ":".join(parts)
