import { useQuery } from '@tanstack/react-query';
import { getDashboardKPIs, getTimelineEvents } from '@/api/dashboard';

export function useDashboardKPIs(sectorCodigos?: string) {
  return useQuery({
    queryKey: ['dashboard', 'kpis', sectorCodigos],
    queryFn: () => getDashboardKPIs(sectorCodigos),
  });
}

export function useTimelineEvents(sectorCodigos?: string) {
  return useQuery({
    queryKey: ['dashboard', 'timeline', sectorCodigos],
    queryFn: () => getTimelineEvents(sectorCodigos),
  });
}
