import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getResearchPublications, createResearchPublication, updateResearchPublication, deleteResearchPublication } from '@/api/researchPublications';
import { queryKeys } from '@/lib/queryKeys';

export function useResearchPublications(page = 1, perPage = 20, sector?: string, q?: string, fechaDesde?: string, fechaHasta?: string, sortBy?: string, sortOrder?: string, mine?: boolean) {
  return useQuery({
    queryKey: queryKeys.researchPublications.list(page, perPage, sector, q, fechaDesde, fechaHasta, sortBy, sortOrder, mine),
    queryFn: () => getResearchPublications(page, perPage, sector, q, fechaDesde, fechaHasta, sortBy, sortOrder, mine),
  });
}

export function useCreateResearchPublication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createResearchPublication,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.researchPublications.all }),
  });
}

export function useUpdateResearchPublication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<import('@/types').ResearchPublication> }) => updateResearchPublication(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.researchPublications.all }),
  });
}

export function useDeleteResearchPublication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteResearchPublication,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.researchPublications.all }),
  });
}
