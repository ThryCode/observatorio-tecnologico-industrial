import { useQuery } from '@tanstack/react-query';
import { getPatents } from '@/api/patents';

export function usePatents(page = 1, perPage = 20, sector?: string, status?: string, q?: string) {
  return useQuery({
    queryKey: ['patents', page, perPage, sector, status, q],
    queryFn: () => getPatents(page, perPage, sector, status, q),
  });
}
