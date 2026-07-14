import { useQuery } from '@tanstack/react-query';
import { getGraphStats, searchGraphNodes, exploreNode } from '@/api/graph';

export function useGraphStats() {
  return useQuery({
    queryKey: ['graph', 'stats'],
    queryFn: getGraphStats,
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
