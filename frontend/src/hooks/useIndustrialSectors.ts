import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getIndustrialSectors, createIndustrialSector, updateIndustrialSector, deleteIndustrialSector } from '@/api/industrialSectors';
import { queryKeys } from '@/lib/queryKeys';

export function useIndustrialSectors(page = 1, perPage = 20) {
  return useQuery({
    queryKey: queryKeys.industrialSectors.list(page, perPage),
    queryFn: () => getIndustrialSectors(page, perPage),
  });
}

export function useCreateIndustrialSector() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createIndustrialSector,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.industrialSectors.all }),
  });
}

export function useUpdateIndustrialSector() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ codigo, data }: { codigo: string; data: { nombre?: string; descripcion?: string } }) =>
      updateIndustrialSector(codigo, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.industrialSectors.all }),
  });
}

export function useDeleteIndustrialSector() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteIndustrialSector,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.industrialSectors.all }),
  });
}
