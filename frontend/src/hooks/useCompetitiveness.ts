import { useQuery } from '@tanstack/react-query';
import { getCompetitivenessData } from '@/api/competitiveness';
import { queryKeys } from '@/lib/queryKeys';

export function useCompetitiveness(periodo?: string, sectorCodigo?: string, q?: string, sortBy?: string, sortOrder?: string) {
  return useQuery({
    queryKey: queryKeys.competitiveness(periodo, sectorCodigo, q, sortBy, sortOrder),
    queryFn: () => getCompetitivenessData(periodo, sectorCodigo, q, sortBy, sortOrder),
  });
}
