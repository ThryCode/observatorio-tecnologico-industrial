from typing import Any

from pydantic import BaseModel


class GraphQueryNode(BaseModel):
    id: str
    labels: list[str]
    props: dict[str, Any]


class GraphQueryEdge(BaseModel):
    source: str
    target: str
    type: str


class GraphQueryResponse(BaseModel):
    nodes: list[GraphQueryNode]
    edges: list[GraphQueryEdge]
    total_nodes: int
    total_edges: int


class GraphExploreResponse(GraphQueryResponse):
    pass


class GraphSearchItem(BaseModel):
    n: dict[str, Any]
    node_labels: list[str]


class GraphSearchResponse(BaseModel):
    items: list[GraphSearchItem]
    total: int
    page: int
    per_page: int


class GraphStatItem(BaseModel):
    label: str
    count: int


class GraphStatsResponse(BaseModel):
    items: list[GraphStatItem]


class SyncResponse(BaseModel):
    nodes_merged: int
    relationships_merged: int
    nodes_deleted: int = 0


class ShortestPathResponse(BaseModel):
    node_ids: list[str] | None = None
    rel_types: list[str] | None = None
    weight: int | None = None


class RecommendationItem(BaseModel):
    id: str
    labels: list[str]
    type: str
    label: str
    reason: str
    props: dict[str, Any]


class RecommendationsResponse(BaseModel):
    org_id: str
    org_name: str | None = None
    items: list[RecommendationItem]
    total: int


class EnterpriseGraphNode(BaseModel):
    id: str
    type: str = "organization"
    label: str
    siglas: str | None = None
    sector: str | None = None
    tipo: str | None = None
    provincia: str | None = None


class EnterpriseGraphEdge(BaseModel):
    source: str
    target: str
    type: str


class EnterpriseGraphResponse(BaseModel):
    nodes: list[EnterpriseGraphNode]
    edges: list[EnterpriseGraphEdge]
