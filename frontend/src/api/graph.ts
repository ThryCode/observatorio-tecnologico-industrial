import client from './client';
import type { GraphStat } from '@/types';

export async function getGraphStats(): Promise<GraphStat[]> {
  const res = await client.get<{ items: GraphStat[] }>('/graph/stats');
  return res.data.items;
}

export async function searchGraphNodes(q: string, labels?: string[], page = 1, perPage = 20): Promise<{ items: unknown[]; total: number; page: number; per_page: number }> {
  const params = new URLSearchParams({ q, page: String(page), per_page: String(perPage) });
  if (labels) params.set('labels', labels.join(','));
  const res = await client.get(`/graph/search?${params}`);
  return res.data;
}

export async function exploreNode(nodeId: string, depth = 2): Promise<unknown> {
  const params = new URLSearchParams({ node_id: nodeId, depth: String(depth) });
  const res = await client.get(`/graph/explore?${params}`);
  return res.data;
}
