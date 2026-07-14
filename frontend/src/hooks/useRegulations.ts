import { useQuery } from '@tanstack/react-query';
import { getRegulations } from '@/api/regulations';

export function useRegulations(page = 1, perPage = 20, category?: string) {
  return useQuery({
    queryKey: ['regulations', page, perPage, category],
    queryFn: () => getRegulations(page, perPage, category),
  });
}
