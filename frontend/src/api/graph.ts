import client from './client';
import type { EnterpriseGraphResponse, GraphQueryResponse, GraphStat, RecommendationsResponse } from '@/types';

export async function getGraphStats(): Promise<GraphStat[]> {
  const res = await client.get<{ items: GraphStat[] }>('/graph/stats');
  return res.data.items;
}

export async function queryGraph(limit = 500): Promise<GraphQueryResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  const res = await client.get<GraphQueryResponse>(`/graph/query?${params}`);
  return res.data;
}

export async function searchGraphNodes(q: string, labels?: string[], page = 1, perPage = 20): Promise<{ items: unknown[]; total: number; page: number; per_page: number }> {
  const params = new URLSearchParams({ q, page: String(page), per_page: String(perPage) });
  if (labels) params.set('labels', labels.join(','));
  const res = await client.get(`/graph/search?${params}`);
  return res.data;
}

export async function exploreNode(nodeId: string, depth = 2): Promise<GraphQueryResponse> {
  const params = new URLSearchParams({ node_id: nodeId, depth: String(depth) });
  const res = await client.get<GraphQueryResponse>(`/graph/explore?${params}`);
  return res.data;
}

export async function getOrgRecommendations(orgId: string, limit = 20): Promise<RecommendationsResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  const res = await client.get<RecommendationsResponse>(`/graph/recommendations/${orgId}?${params}`);
  return res.data;
}

export async function getEnterpriseGraph(): Promise<EnterpriseGraphResponse> {
  const res = await client.get<EnterpriseGraphResponse>('/graph/enterprise');
  return res.data;
}
