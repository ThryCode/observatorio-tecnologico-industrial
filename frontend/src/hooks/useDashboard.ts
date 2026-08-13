import { useQuery } from '@tanstack/react-query';
import { getDashboardKPIs, getTimelineEvents } from '@/api/dashboard';
import { queryKeys } from '@/lib/queryKeys';

export function useDashboardKPIs(sectorCodigos?: string) {
  return useQuery({
    queryKey: queryKeys.dashboardKPIs(sectorCodigos),
    queryFn: () => getDashboardKPIs(sectorCodigos),
  });
}

export function useTimelineEvents(sectorCodigos?: string) {
  return useQuery({
    queryKey: queryKeys.timelineEvents(sectorCodigos),
    queryFn: () => getTimelineEvents(sectorCodigos),
  });
}
