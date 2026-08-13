import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrganizations, createOrganization, updateOrganization, deleteOrganization } from '@/api/organizations';
import { queryKeys } from '@/lib/queryKeys';

export function useOrganizations(page = 1, perPage = 20, sectorCodigo?: string, q?: string, pais?: string, provincia?: string, sortBy?: string, sortOrder?: string) {
  return useQuery({
    queryKey: queryKeys.organizations.list(page, perPage, sectorCodigo, q, pais, provincia, sortBy, sortOrder),
    queryFn: () => getOrganizations(page, perPage, sectorCodigo, q, pais, provincia, sortBy, sortOrder),
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrganization,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all }),
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<import('@/types').Organization> }) => updateOrganization(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all }),
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOrganization,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all }),
  });
}
