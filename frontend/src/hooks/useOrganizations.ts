import { useQuery } from '@tanstack/react-query';
import { getOrganizations } from '@/api/organizations';

export function useOrganizations(page = 1, perPage = 20, tipo?: string) {
  return useQuery({
    queryKey: ['organizations', page, perPage, tipo],
    queryFn: () => getOrganizations(page, perPage, tipo),
  });
}
