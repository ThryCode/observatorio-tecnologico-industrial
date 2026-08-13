import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTechnologies, createTechnology, updateTechnology, deleteTechnology } from '@/api/technologies';
import { queryKeys } from '@/lib/queryKeys';

export function useTechnologies(page = 1, perPage = 20, sector?: string, q?: string, trlNivel?: number, sortBy?: string, sortOrder?: string) {
  return useQuery({
    queryKey: queryKeys.technologies.list(page, perPage, sector, q, trlNivel, sortBy, sortOrder),
    queryFn: () => getTechnologies(page, perPage, sector, q, trlNivel, sortBy, sortOrder),
  });
}

export function useCreateTechnology() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTechnology,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.technologies.all }),
  });
}

export function useUpdateTechnology() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<import('@/types').Technology> }) => updateTechnology(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.technologies.all }),
  });
}

export function useDeleteTechnology() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTechnology,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.technologies.all }),
  });
}
