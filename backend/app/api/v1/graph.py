import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select

from app.core.db import get_db
from app.core.exceptions import AppException
from app.dependencies import get_current_user, get_neo4j, require_role
from app.models.follow import Follow
from app.models.organization import Organization
from app.models.patent import Patent, PatentStatus
from app.models.user import User, UserRole
from app.schemas.graph import (
    EnterpriseGraphEdge,
    EnterpriseGraphNode,
    EnterpriseGraphPatent,
    EnterpriseGraphResponse,
    GraphExploreResponse,
    GraphQueryResponse,
    GraphSearchResponse,
    GraphStatsResponse,
    RecommendationsResponse,
    ShortestPathResponse,
    SyncResponse,
)

router = APIRouter(prefix="/graph", tags=["graph"])


@router.get("/query", response_model=GraphQueryResponse)
async def query_graph(
    limit: int = Query(500, ge=1, le=2000),
    sector_codigos: str | None = Query(None),
    neo4j=Depends(get_neo4j),
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
    sector_codigos: str | None = Query(None),
    neo4j=Depends(get_neo4j),
    _: User = Depends(get_current_user),
):
    if not neo4j:
        raise AppException(503, "Neo4j is not available")
    from app.graph.repository import GraphRepository
    repo = GraphRepository(neo4j)
    codes = [c.strip() for c in sector_codigos.split(",")] if sector_codigos else None
    items = await repo.stats(codes)
    return {"items": items}


@router.post("/sync", response_model=SyncResponse)
async def sync_graph(
    neo4j=Depends(get_neo4j),
    db=Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN_MINDUS)),
):
    if not neo4j:
        raise AppException(503, "Neo4j is not available")
    from app.graph.repository import GraphRepository
    repo = GraphRepository(neo4j)
    return await repo.sync_all(db)


@router.post("/sync-enterprise", response_model=SyncResponse)
async def sync_enterprise_graph(
    neo4j=Depends(get_neo4j),
    db=Depends(get_db),
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
    db=Depends(get_db),
    neo4j=Depends(get_neo4j),
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
    neo4j=Depends(get_neo4j),
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
    db=Depends(get_db),
    _: User = Depends(get_current_user),
):
    orgs_result = await db.execute(select(Organization))
    orgs = {str(o.id): o for o in orgs_result.scalars().all()}

    users_result = await db.execute(select(User))
    user_org_map = {
        str(u.id): str(u.organization_id)
        for u in users_result.scalars().all()
        if u.organization_id
    }

    follows_result = await db.execute(
        select(Follow).where(Follow.follower_type == "user")
    )
    follows = follows_result.scalars().all()

    org_ids = list(orgs.keys())
    patents_result = await db.execute(
        select(Patent).where(Patent.organization_id.in_([uuid.UUID(oid) for oid in org_ids]))
    )
    all_patents = patents_result.scalars().all()

    patents_by_org: dict[str, list[Patent]] = {}
    for p in all_patents:
        oid = str(p.organization_id)
        if oid not in patents_by_org:
            patents_by_org[oid] = []
        patents_by_org[oid].append(p)

    nodes: list[EnterpriseGraphNode] = []
    for o in orgs.values():
        oid = str(o.id)
        org_patents = patents_by_org.get(oid, [])
        patent_list = [
            EnterpriseGraphPatent(
                id=str(p.id),
                title=p.title,
                patent_number=p.patent_number,
                status=p.status.value if p.status else "filed",
                filing_date=str(p.filing_date) if p.filing_date else None,
                publication_date=str(p.publication_date) if p.publication_date else None,
                technological_sector=p.technological_sector,
                country=p.country,
            )
            for p in org_patents
        ]
        active = sum(1 for p in org_patents if p.status in (PatentStatus.GRANTED, PatentStatus.EXAMINATION))
        pending = sum(1 for p in org_patents if p.status == PatentStatus.FILED)
        nodes.append(EnterpriseGraphNode(
            id=oid,
            type="organization",
            label=f"{o.nombre} ({o.siglas})",
            siglas=o.siglas,
            sector=o.sector_codigo,
            tipo=o.tipo,
            provincia=o.provincia,
            patents=patent_list,
            patents_active=active,
            patents_pending=pending,
        ))

    edges: list[EnterpriseGraphEdge] = []
    seen_edges: set[str] = set()
    for f in follows:
        follower_org_id = user_org_map.get(str(f.follower_id))
        if not follower_org_id or follower_org_id == str(f.organization_id):
            continue
        if follower_org_id in orgs and str(f.organization_id) in orgs:
            key = f"{follower_org_id}->{f.organization_id}"
            if key not in seen_edges:
                seen_edges.add(key)
                edges.append(EnterpriseGraphEdge(
                    source=follower_org_id,
                    target=str(f.organization_id),
                    type="FOLLOWS",
                ))

    return EnterpriseGraphResponse(nodes=nodes, edges=edges)
