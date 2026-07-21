from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.dependencies import get_neo4j, get_redis

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check(
    db: AsyncSession = Depends(get_db),
    neo4j=Depends(get_neo4j),
    redis=Depends(get_redis),
):
    checks = {}

    # PostgreSQL
    try:
        await db.execute(text("SELECT 1"))
        checks["postgresql"] = {"status": "ok"}
    except Exception as e:
        checks["postgresql"] = {"status": "error", "detail": str(e)}

    # Neo4j
    try:
        if neo4j is None:
            checks["neo4j"] = {"status": "unavailable"}
        else:
            async with neo4j.session() as session:
                await session.run("RETURN 1")
            checks["neo4j"] = {"status": "ok"}
    except Exception as e:
        checks["neo4j"] = {"status": "error", "detail": str(e)}

    # Redis
    try:
        if redis is None:
            checks["redis"] = {"status": "unavailable"}
        else:
            await redis.ping()
            checks["redis"] = {"status": "ok"}
    except Exception as e:
        checks["redis"] = {"status": "error", "detail": str(e)}

    all_ok = all(c["status"] in ("ok", "unavailable") for c in checks.values())

    return {
        "status": "healthy" if all_ok else "degraded",
        "services": checks,
    }
