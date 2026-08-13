import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPatents, createPatent, updatePatent, deletePatent } from '@/api/patents';
import { queryKeys } from '@/lib/queryKeys';

export function usePatents(page = 1, perPage = 20, sector?: string, status?: string, q?: string, fechaDesde?: string, fechaHasta?: string, sortBy?: string, sortOrder?: string) {
  return useQuery({
    queryKey: queryKeys.patents.list(page, perPage, sector, status, q, fechaDesde, fechaHasta, sortBy, sortOrder),
    queryFn: () => getPatents(page, perPage, sector, status, q, fechaDesde, fechaHasta, sortBy, sortOrder),
  });
}

export function useCreatePatent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPatent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.patents.all }),
  });
}

export function useUpdatePatent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<import('@/types').Patent> }) => updatePatent(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.patents.all }),
  });
}

export function useDeletePatent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePatent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.patents.all }),
  });
}
