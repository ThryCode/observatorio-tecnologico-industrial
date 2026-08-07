import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getIndustrialSectors, createIndustrialSector, updateIndustrialSector, deleteIndustrialSector } from '@/api/industrialSectors';

export function useIndustrialSectors(page = 1, perPage = 20) {
  return useQuery({
    queryKey: ['industrial-sectors', page, perPage],
    queryFn: () => getIndustrialSectors(page, perPage),
  });
}

export function useCreateIndustrialSector() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createIndustrialSector,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['industrial-sectors'] }),
  });
}

export function useUpdateIndustrialSector() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ codigo, data }: { codigo: string; data: { nombre?: string; descripcion?: string } }) =>
      updateIndustrialSector(codigo, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['industrial-sectors'] }),
  });
}

export function useDeleteIndustrialSector() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteIndustrialSector,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['industrial-sectors'] }),
  });
}
