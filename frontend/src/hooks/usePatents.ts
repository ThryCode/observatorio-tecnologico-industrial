import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPatents, createPatent, updatePatent, deletePatent } from '@/api/patents';

export function usePatents(page = 1, perPage = 20, sector?: string, status?: string, q?: string) {
  return useQuery({
    queryKey: ['patents', page, perPage, sector, status, q],
    queryFn: () => getPatents(page, perPage, sector, status, q),
  });
}

export function useCreatePatent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPatent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patents'] }),
  });
}

export function useUpdatePatent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<import('@/types').Patent> }) => updatePatent(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patents'] }),
  });
}

export function useDeletePatent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePatent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patents'] }),
  });
}
