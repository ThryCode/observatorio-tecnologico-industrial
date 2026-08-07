from fastapi import APIRouter, Depends, Query
from neo4j import AsyncDriver
from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.exceptions import AppException
from app.dependencies import get_current_user, get_neo4j, get_redis, require_role
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.schemas.graph import (
    EnterpriseGraphResponse,
    GraphExploreResponse,
    GraphQueryResponse,
    GraphSearchResponse,
    GraphStatsResponse,
    RecommendationsResponse,
    ShortestPathResponse,
    SyncResponse,
)
from app.services.cache import cache_key, get_cached, set_cached

router = APIRouter(prefix="/graph", tags=["graph"])


@router.get("/query", response_model=GraphQueryResponse)
async def query_graph(
    limit: int = Query(500, ge=1, le=2000),
    sector_codigos: str | None = Query(None),
    neo4j: AsyncDriver | None = Depends(get_neo4j),
    _: User = Depends(get_current_user),
):
    if not neo4j:
        raise AppException(503, "Neo4j is not available")
    from app.graph.repository import GraphRepository
    repo = GraphRepository(neo4j)
    codes = [c.strip() for c in sector_codigos.split(",")] if sector_codigos else None
    return await repo.query_graph(limit, codes)


@router.get("/explore", response_model=GraphExploreResponse)
async def explore_node(
    node_id: str = Query(...),
    depth: int = Query(2, ge=1, le=5),
    neo4j: AsyncDriver | None = Depends(get_neo4j),
    _: User = Depends(get_current_user),
):
    if not neo4j:
        raise AppException(503, "Neo4j is not available")
    from app.graph.repository import GraphRepository
    repo = GraphRepository(neo4j)
    result = await repo.explore_node(node_id, depth)
    return result or GraphExploreResponse()


@router.get("/search", response_model=GraphSearchResponse)
async def search_nodes(
    q: str = Query(...),
    labels: str | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    neo4j: AsyncDriver | None = Depends(get_neo4j),
    _: User = Depends(get_current_user),
):
    if not neo4j:
        raise AppException(503, "Neo4j is not available")
    from app.graph.repository import GraphRepository
    repo = GraphRepository(neo4j)
    label_list = labels.split(",") if labels else None
    return await repo.search_nodes(q, label_list, page, per_page)


@router.get("/stats", response_model=GraphStatsResponse)
async def graph_stats(
    sector_codigos: str | None = Query(None),
    neo4j: AsyncDriver | None = Depends(get_neo4j),
    redis: Redis | None = Depends(get_redis),
    _: User = Depends(get_current_user),
):
    if not neo4j:
        raise AppException(503, "Neo4j is not available")

    key = cache_key("graph:stats", sector=sector_codigos or "all")
    cached = await get_cached(redis, key)
    if cached:
        return {"items": cached}

    from app.graph.repository import GraphRepository
    repo = GraphRepository(neo4j)
    codes = [c.strip() for c in sector_codigos.split(",")] if sector_codigos else None
    items = await repo.stats(codes)

    await set_cached(redis, key, items, ttl=300)
    return {"items": items}


@router.post("/sync", response_model=SyncResponse)
async def sync_graph(
    neo4j: AsyncDriver | None = Depends(get_neo4j),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN_MINDUS)),
):
    if not neo4j:
        raise AppException(503, "Neo4j is not available")
    from app.graph.repository import GraphRepository
    repo = GraphRepository(neo4j)
    return await repo.sync_all(db)


@router.post("/sync-enterprise", response_model=SyncResponse)
async def sync_enterprise_graph(
    neo4j: AsyncDriver | None = Depends(get_neo4j),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN_MINDUS)),
):
    if not neo4j:
        raise AppException(503, "Neo4j is not available")
    from app.graph.repository import GraphRepository
    repo = GraphRepository(neo4j)
    return await repo.sync_enterprise_graph(db)


@router.get("/recommendations/{org_id}", response_model=RecommendationsResponse)
async def recommendations_for_org(
    org_id: str,
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    neo4j: AsyncDriver | None = Depends(get_neo4j),
    _: User = Depends(get_current_user),
):
    if not neo4j:
        raise AppException(503, "Neo4j is not available")

    org = (
        await db.execute(select(Organization).where(Organization.id == org_id))
    ).scalar_one_or_none()

    from app.graph.repository import GraphRepository
    repo = GraphRepository(neo4j)
    result = await repo.recommendations_for_org(org_id, limit)
    return RecommendationsResponse(
        org_id=org_id,
        org_name=org.nombre if org else None,
        items=result["items"],
        total=result["total"],
    )


@router.get("/shortest-path", response_model=ShortestPathResponse)
async def find_shortest_path(
    from_id: str = Query(..., alias="from"),
    to_id: str = Query(..., alias="to"),
    max_depth: int = Query(10, ge=1, le=50),
    neo4j: AsyncDriver | None = Depends(get_neo4j),
    _: User = Depends(get_current_user),
):
    if not neo4j:
        raise AppException(503, "Neo4j is not available")
    from app.graph.repository import GraphRepository
    repo = GraphRepository(neo4j)
    result = await repo.shortest_path(from_id, to_id, max_depth)
    return result or ShortestPathResponse()


@router.get("/enterprise", response_model=EnterpriseGraphResponse)
async def enterprise_graph(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    from app.services.graph_service import GraphService
    return await GraphService(db).get_enterprise_graph()
