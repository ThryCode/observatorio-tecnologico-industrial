import { useQuery } from '@tanstack/react-query';
import { getPatentMapSummary } from '@/api/patentMaps';

export function usePatentMaps() {
  return useQuery({
    queryKey: ['patentMaps'],
    queryFn: () => getPatentMapSummary(),
  });
}
