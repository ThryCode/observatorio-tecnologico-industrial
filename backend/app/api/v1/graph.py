from fastapi import APIRouter, Depends, Query

from app.core.db import get_db
from app.core.exceptions import AppException
from app.dependencies import get_current_superuser, get_current_user, get_neo4j
from app.models.user import User
from app.schemas.graph import (
    GraphExploreResponse,
    GraphSearchResponse,
    GraphStatsResponse,
    ShortestPathResponse,
    SyncResponse,
)

router = APIRouter(prefix="/graph", tags=["graph"])


@router.get("/explore", response_model=GraphExploreResponse)
async def explore_node(
    node_id: str = Query(...),
    depth: int = Query(2, ge=1, le=5),
    neo4j=Depends(get_neo4j),
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
    neo4j=Depends(get_neo4j),
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
    neo4j=Depends(get_neo4j),
    _: User = Depends(get_current_user),
):
    if not neo4j:
        raise AppException(503, "Neo4j is not available")
    from app.graph.repository import GraphRepository
    repo = GraphRepository(neo4j)
    items = await repo.stats()
    return {"items": items}


@router.post("/sync", response_model=SyncResponse)
async def sync_graph(
    neo4j=Depends(get_neo4j),
    db=Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    if not neo4j:
        raise AppException(503, "Neo4j is not available")
    from app.graph.repository import GraphRepository
    repo = GraphRepository(neo4j)
    return await repo.sync_all(db)


@router.get("/shortest-path", response_model=ShortestPathResponse)
async def find_shortest_path(
    from_id: str = Query(..., alias="from"),
    to_id: str = Query(..., alias="to"),
    max_depth: int = Query(10, ge=1, le=50),
    neo4j=Depends(get_neo4j),
    _: User = Depends(get_current_user),
):
    if not neo4j:
        raise AppException(503, "Neo4j is not available")
    from app.graph.repository import GraphRepository
    repo = GraphRepository(neo4j)
    result = await repo.shortest_path(from_id, to_id, max_depth)
    return result or ShortestPathResponse()
