import { useQuery } from '@tanstack/react-query';
import { getCompetitivenessData } from '@/api/competitiveness';

export function useCompetitiveness() {
  return useQuery({
    queryKey: ['competitiveness'],
    queryFn: getCompetitivenessData,
  });
}
