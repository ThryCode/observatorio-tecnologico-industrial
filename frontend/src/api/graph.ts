import client from './client';
import type { GraphStat } from '@/types';

export interface GraphNodeData {
  id: string;
  labels: string[];
  properties: Record<string, unknown>;
}

export interface GraphLinkData {
  source: string;
  target: string;
  type: string;
}

export interface ExploreResult {
  nodes: GraphNodeData[];
  relationships: GraphLinkData[];
}

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

export async function exploreNode(nodeId: string, depth = 2): Promise<ExploreResult> {
  const params = new URLSearchParams({ node_id: nodeId, depth: String(depth) });
  const res = await client.get(`/graph/explore?${params}`);
  return res.data;
}

export async function syncGraph(): Promise<{ nodes_merged: number; relationships_merged: number }> {
  const res = await client.post('/graph/sync');
  return res.data;
}

export async function getShortestPath(fromId: string, toId: string, maxDepth = 10): Promise<{ node_ids: string[]; rel_types: string[]; weight: number } | null> {
  const params = new URLSearchParams({ from: fromId, to: toId, max_depth: String(maxDepth) });
  const res = await client.get(`/graph/shortest-path?${params}`);
  return res.data.node_ids ? res.data : null;
}

export async function getSyncStatus(): Promise<{ total_nodes: number; node_counts: Record<string, number> }> {
  const res = await client.get('/graph/sync/status');
  return res.data;
}