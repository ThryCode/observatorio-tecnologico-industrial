import redis.asyncio as aioredis
from app.core.config import Settings


def create_redis_client(settings: Settings):
    return aioredis.from_url(settings.redis_url, decode_responses=True)
