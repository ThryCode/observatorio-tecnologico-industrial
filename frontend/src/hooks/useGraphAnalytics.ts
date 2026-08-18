import { useQuery } from '@tanstack/react-query';
import { getGraphCentrality, getGraphCommunities, getGraphSimilar } from '@/api/graphAnalytics';
import { queryKeys } from '@/lib/queryKeys';

export function useGraphCentrality(limit = 20, label?: string) {
  return useQuery({
    queryKey: queryKeys.graphCentrality(limit, label),
    queryFn: () => getGraphCentrality(limit, label),
    retry: false,
  });
}

export function useGraphCommunities(limit = 50, label?: string) {
  return useQuery({
    queryKey: queryKeys.graphCommunities(limit, label),
    queryFn: () => getGraphCommunities(limit, label),
    retry: false,
  });
}

export function useGraphSimilar(nodeId: string | null, limit = 10) {
  return useQuery({
    queryKey: queryKeys.graphSimilar(nodeId, limit),
    queryFn: () => getGraphSimilar(nodeId!, limit),
    enabled: !!nodeId,
    retry: false,
  });
}
