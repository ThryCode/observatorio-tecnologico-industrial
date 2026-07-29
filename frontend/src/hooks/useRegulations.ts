import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRegulations, createRegulation, updateRegulation, deleteRegulation } from '@/api/regulations';

export function useRegulations(page = 1, perPage = 20, category?: string, q?: string, sectorCodigo?: string, fechaDesde?: string, fechaHasta?: string, sortBy?: string, sortOrder?: string) {
  return useQuery({
    queryKey: ['regulations', page, perPage, category, q, sectorCodigo, fechaDesde, fechaHasta, sortBy, sortOrder],
    queryFn: () => getRegulations(page, perPage, category, q, sectorCodigo, fechaDesde, fechaHasta, sortBy, sortOrder),
  });
}

export function useCreateRegulation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRegulation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['regulations'] }),
  });
}

export function useUpdateRegulation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<import('@/types').Regulation> }) => updateRegulation(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['regulations'] }),
  });
}

export function useDeleteRegulation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRegulation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['regulations'] }),
  });
}
