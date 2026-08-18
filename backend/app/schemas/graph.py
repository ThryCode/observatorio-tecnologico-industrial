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


class EnterpriseGraphPatent(BaseModel):
    id: str
    title: str
    patent_number: str
    status: str
    filing_date: str | None = None
    publication_date: str | None = None
    technological_sector: str | None = None
    country: str | None = None


class EnterpriseGraphNode(BaseModel):
    id: str
    type: str = "organization"
    label: str
    siglas: str | None = None
    sector: str | None = None
    tipo: str | None = None
    provincia: str | None = None
    patents: list[EnterpriseGraphPatent] = []
    patents_active: int = 0
    patents_pending: int = 0


class EnterpriseGraphEdge(BaseModel):
    source: str
    target: str
    type: str


class EnterpriseGraphResponse(BaseModel):
    nodes: list[EnterpriseGraphNode]
    edges: list[EnterpriseGraphEdge]


class PageRankItem(BaseModel):
    id: str
    label: str
    score: float
    labels: list[str] = []
    props: dict[str, Any] = {}


class PageRankResponse(BaseModel):
    items: list[PageRankItem]
    total: int


class CommunityNode(BaseModel):
    id: str
    label: str
    props: dict[str, Any] = {}


class CommunityItem(BaseModel):
    community_id: int
    nodes: list[CommunityNode]
    size: int


class CommunityResponse(BaseModel):
    items: list[CommunityItem]
    total: int


class SimilarNode(BaseModel):
    id: str
    label: str
    similarity: float
    relationship: str
    strength: int
    labels: list[str] = []
    props: dict[str, Any] = {}


class SimilarResponse(BaseModel):
    items: list[SimilarNode]
    total: int
