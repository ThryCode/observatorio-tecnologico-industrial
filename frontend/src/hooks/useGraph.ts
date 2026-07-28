import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGraphStats, searchGraphNodes, exploreNode, syncGraph, getShortestPath } from '@/api/graph';

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

export function useGraphSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncGraph,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graph', 'stats'] });
    },
  });
}

export function useShortestPath(fromId: string, toId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['graph', 'shortest-path', fromId, toId],
    queryFn: () => getShortestPath(fromId, toId),
    enabled,
    retry: false,
  });
}