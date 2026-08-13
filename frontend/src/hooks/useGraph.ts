import { useQuery } from '@tanstack/react-query';
import { getGraphStats, searchGraphNodes, exploreNode, queryGraph, getEnterpriseGraph, getOrgRecommendations } from '@/api/graph';
import { queryKeys } from '@/lib/queryKeys';

export function useGraphStats(sectorCodigos?: string[]) {
  return useQuery({
    queryKey: queryKeys.graphStats(sectorCodigos),
    queryFn: () => getGraphStats(sectorCodigos),
    retry: false,
  });
}

export function useGraphQuery(limit = 500, sectorCodigos?: string[]) {
  return useQuery({
    queryKey: queryKeys.knowledgeGraph(limit, sectorCodigos),
    queryFn: () => queryGraph(limit, sectorCodigos),
    retry: false,
  });
}

export function useGraphSearch(q: string, labels?: string[]) {
  return useQuery({
    queryKey: queryKeys.graphSearch(q, labels),
    queryFn: () => searchGraphNodes(q, labels),
    enabled: q.length > 0,
  });
}

export function useGraphExplore(nodeId: string, depth = 2) {
  return useQuery({
    queryKey: queryKeys.graphExplore(nodeId, depth),
    queryFn: () => exploreNode(nodeId, depth),
    enabled: !!nodeId,
  });
}

export function useEnterpriseGraph() {
  return useQuery({
    queryKey: queryKeys.graphEnterprise(),
    queryFn: getEnterpriseGraph,
  });
}

export function useOrgRecommendations(orgId: string | null, limit = 20) {
  return useQuery({
    queryKey: queryKeys.graphRecommendations(orgId, limit),
    queryFn: () => getOrgRecommendations(orgId!, limit),
    enabled: !!orgId,
    retry: false,
  });
}
