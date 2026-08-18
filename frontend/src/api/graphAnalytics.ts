import client from './client';
import type { PageRankResponse, CommunityResponse, SimilarResponse } from '@/types';

export async function getGraphCentrality(limit = 20, label?: string): Promise<PageRankResponse> {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (label) params.set('label', label);
  const res = await client.get('/graph/centrality', { params });
  return res.data;
}

export async function getGraphCommunities(limit = 50, label?: string): Promise<CommunityResponse> {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (label) params.set('label', label);
  const res = await client.get('/graph/communities', { params });
  return res.data;
}

export async function getGraphSimilar(nodeId: string, limit = 10): Promise<SimilarResponse> {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  const res = await client.get(`/graph/similar/${encodeURIComponent(nodeId)}`, { params });
  return res.data;
}
