import { useQuery } from '@tanstack/react-query';
import { getPatentMapSummary } from '@/api/patentMaps';
import { queryKeys } from '@/lib/queryKeys';

export function usePatentMaps() {
  return useQuery({
    queryKey: queryKeys.patentMaps(),
    queryFn: () => getPatentMapSummary(),
  });
}
