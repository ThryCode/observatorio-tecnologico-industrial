from fastapi import APIRouter, Depends, Query
from neo4j import AsyncGraphDatabase

from app.graph.repository import GraphRepository
from app.dependencies import get_neo4j

router = APIRouter(prefix="/graph", tags=["graph"])


@router.get("/explore")
async def explore_node(
    node_id: str = Query(...),
    depth: int = Query(2, ge=1, le=5),
    neo4j: AsyncGraphDatabase = Depends(get_neo4j),
):
    repo = GraphRepository(neo4j)
    return await repo.explore_node(node_id, depth)


@router.get("/search")
async def search_nodes(
    q: str = Query(...),
    labels: str | None = Query(None),
    neo4j: AsyncGraphDatabase = Depends(get_neo4j),
):
    repo = GraphRepository(neo4j)
    label_list = labels.split(",") if labels else None
    return await repo.search_nodes(q, label_list)


@router.get("/stats")
async def graph_stats(neo4j: AsyncGraphDatabase = Depends(get_neo4j)):
    repo = GraphRepository(neo4j)
    return await repo.stats()
