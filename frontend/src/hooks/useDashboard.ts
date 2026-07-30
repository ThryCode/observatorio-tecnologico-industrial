import { useQuery } from '@tanstack/react-query';
import { getDashboardKPIs, getTimelineEvents } from '@/api/dashboard';

export function useDashboardKPIs(sectorCodigo?: string) {
  return useQuery({
    queryKey: ['dashboard', 'kpis', sectorCodigo],
    queryFn: () => getDashboardKPIs(sectorCodigo),
  });
}

export function useTimelineEvents(sectorCodigo?: string) {
  return useQuery({
    queryKey: ['dashboard', 'timeline', sectorCodigo],
    queryFn: () => getTimelineEvents(sectorCodigo),
  });
}
