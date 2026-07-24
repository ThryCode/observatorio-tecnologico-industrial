import { useQuery } from '@tanstack/react-query';
import { listAlerts } from '@/api/alerts';

export function useAlerts(unreadOnly = false) {
  return useQuery({
    queryKey: ['alerts', { unreadOnly }],
    queryFn: () => listAlerts(unreadOnly),
  });
}
