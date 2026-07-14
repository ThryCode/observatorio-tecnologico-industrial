import { useQuery } from '@tanstack/react-query';
import { getTechnologies } from '@/api/technologies';

export function useTechnologies(page = 1, perPage = 20, sector?: string) {
  return useQuery({
    queryKey: ['technologies', page, perPage, sector],
    queryFn: () => getTechnologies(page, perPage, sector),
  });
}
