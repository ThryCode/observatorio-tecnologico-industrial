import { useQuery } from '@tanstack/react-query';
import { getIndicators } from '@/api/indicators';

export function useIndicators(page = 1, perPage = 20, sector?: string, period?: string) {
  return useQuery({
    queryKey: ['indicators', page, perPage, sector, period],
    queryFn: () => getIndicators(page, perPage, sector, period),
  });
}
