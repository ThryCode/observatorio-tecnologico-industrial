import { useQuery } from '@tanstack/react-query';
import { getDashboardKPIs, getTimelineEvents } from '@/api/dashboard';

export function useDashboardKPIs() {
  return useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: getDashboardKPIs,
  });
}

export function useTimelineEvents() {
  return useQuery({
    queryKey: ['dashboard', 'timeline'],
    queryFn: getTimelineEvents,
  });
}
