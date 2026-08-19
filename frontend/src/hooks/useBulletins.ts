import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listBulletins, createBulletin, updateBulletin, deleteBulletin } from '@/api/bulletins';
import { queryKeys } from '@/lib/queryKeys';

export function useBulletins(page = 1, perPage = 20, sectorCodigo?: string, categoria?: string, q?: string, fechaDesde?: string, fechaHasta?: string, sortBy?: string, sortOrder?: string) {
  return useQuery({
    queryKey: queryKeys.bulletins.list(page, perPage, sectorCodigo, categoria, q, fechaDesde, fechaHasta, sortBy, sortOrder),
    queryFn: () => listBulletins(page, perPage, sectorCodigo, categoria, q, fechaDesde, fechaHasta, sortBy, sortOrder),
  });
}

export function useCreateBulletin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBulletin,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.bulletins.all }),
  });
}

export function useUpdateBulletin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateBulletin>[1] }) => updateBulletin(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.bulletins.all }),
  });
}

export function useDeleteBulletin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBulletin,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.bulletins.all }),
  });
}
