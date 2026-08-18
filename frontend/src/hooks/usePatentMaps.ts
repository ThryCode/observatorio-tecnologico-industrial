import { useQuery } from '@tanstack/react-query';
import { getPatentMapSummary } from '@/api/patentMaps';
import { queryKeys } from '@/lib/queryKeys';

export function usePatentMaps(pais?: string, sectorCodigo?: string) {
  return useQuery({
    queryKey: [...queryKeys.patentMaps(), pais, sectorCodigo],
    queryFn: () => getPatentMapSummary(pais, sectorCodigo),
  });
}
