import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getResearchPublications, createResearchPublication, updateResearchPublication, deleteResearchPublication } from '@/api/researchPublications';

export function useResearchPublications(page = 1, perPage = 20, sector?: string, q?: string, fechaDesde?: string, fechaHasta?: string, sortBy?: string, sortOrder?: string) {
  return useQuery({
    queryKey: ['research-publications', page, perPage, sector, q, fechaDesde, fechaHasta, sortBy, sortOrder],
    queryFn: () => getResearchPublications(page, perPage, sector, q, fechaDesde, fechaHasta, sortBy, sortOrder),
  });
}

export function useCreateResearchPublication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createResearchPublication,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['research-publications'] }),
  });
}

export function useUpdateResearchPublication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<import('@/types').ResearchPublication> }) => updateResearchPublication(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['research-publications'] }),
  });
}

export function useDeleteResearchPublication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteResearchPublication,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['research-publications'] }),
  });
}
