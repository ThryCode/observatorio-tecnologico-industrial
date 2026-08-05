import { useQuery } from '@tanstack/react-query';
import { getGraphStats, searchGraphNodes, exploreNode, queryGraph, getEnterpriseGraph, getOrgRecommendations } from '@/api/graph';

export function useGraphStats(sectorCodigo?: string) {
  return useQuery({
    queryKey: ['graph', 'stats', sectorCodigo],
    queryFn: () => getGraphStats(sectorCodigo),
    retry: false,
  });
}

export function useGraphQuery(limit = 500, sectorCodigo?: string) {
  return useQuery({
    queryKey: ['graph', 'query', limit, sectorCodigo],
    queryFn: () => queryGraph(limit, sectorCodigo),
    retry: false,
  });
}

export function useGraphSearch(q: string, labels?: string[]) {
  return useQuery({
    queryKey: ['graph', 'search', q, labels],
    queryFn: () => searchGraphNodes(q, labels),
    enabled: q.length > 0,
  });
}

export function useGraphExplore(nodeId: string, depth = 2) {
  return useQuery({
    queryKey: ['graph', 'explore', nodeId, depth],
    queryFn: () => exploreNode(nodeId, depth),
    enabled: !!nodeId,
  });
}

export function useEnterpriseGraph() {
  return useQuery({
    queryKey: ['graph', 'enterprise'],
    queryFn: getEnterpriseGraph,
  });
}

export function useOrgRecommendations(orgId: string | null, limit = 20) {
  return useQuery({
    queryKey: ['graph', 'recommendations', orgId, limit],
    queryFn: () => getOrgRecommendations(orgId!, limit),
    enabled: !!orgId,
    retry: false,
  });
}
