import { useQuery } from '@tanstack/react-query';
import { getOrganizations } from '@/api/organizations';

export function useOrganizations(page = 1, perPage = 20, sectorCodigo?: string) {
  return useQuery({
    queryKey: ['organizations', page, perPage, sectorCodigo],
    queryFn: () => getOrganizations(page, perPage, sectorCodigo),
  });
}
