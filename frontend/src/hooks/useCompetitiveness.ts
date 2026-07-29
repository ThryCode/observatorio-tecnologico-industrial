import { useQuery } from '@tanstack/react-query';
import { getCompetitivenessData } from '@/api/competitiveness';

export function useCompetitiveness(periodo?: string, sectorCodigo?: string, q?: string, sortBy?: string, sortOrder?: string) {
  return useQuery({
    queryKey: ['competitiveness', periodo, sectorCodigo, q, sortBy, sortOrder],
    queryFn: () => getCompetitivenessData(periodo, sectorCodigo, q, sortBy, sortOrder),
  });
}
