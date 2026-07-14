from fastapi import APIRouter, Depends, Query
from neo4j import AsyncDriver

from app.core.exceptions import AppException
from app.dependencies import get_current_user, get_neo4j
from app.models.user import User
from app.schemas.graph import GraphExploreResponse

router = APIRouter(prefix="/graph", tags=["graph"])


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


@router.get("/search", response_model=list[dict])
async def search_nodes(
    q: str = Query(...),
    labels: str | None = Query(None),
    neo4j: AsyncDriver | None = Depends(get_neo4j),
    _: User = Depends(get_current_user),
):
    if not neo4j:
        raise AppException(503, "Neo4j is not available")
    from app.graph.repository import GraphRepository
    repo = GraphRepository(neo4j)
    label_list = labels.split(",") if labels else None
    return await repo.search_nodes(q, label_list)


@router.get("/stats", response_model=list[dict])
async def graph_stats(
    neo4j: AsyncDriver | None = Depends(get_neo4j),
    _: User = Depends(get_current_user),
):
    if not neo4j:
        raise AppException(503, "Neo4j is not available")
    from app.graph.repository import GraphRepository
    repo = GraphRepository(neo4j)
    return await repo.stats()
