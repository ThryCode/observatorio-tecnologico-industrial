import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrganizations, createOrganization, updateOrganization, deleteOrganization } from '@/api/organizations';

export function useOrganizations(page = 1, perPage = 20, sectorCodigo?: string) {
  return useQuery({
    queryKey: ['organizations', page, perPage, sectorCodigo],
    queryFn: () => getOrganizations(page, perPage, sectorCodigo),
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrganization,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organizations'] }),
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<import('@/types').Organization> }) => updateOrganization(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organizations'] }),
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOrganization,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organizations'] }),
  });
}
