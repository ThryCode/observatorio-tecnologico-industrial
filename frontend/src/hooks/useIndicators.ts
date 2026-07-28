import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getIndicators, createIndicator, updateIndicator, deleteIndicator } from '@/api/indicators';

export function useIndicators(page = 1, perPage = 20, sector?: string, period?: string) {
  return useQuery({
    queryKey: ['indicators', page, perPage, sector, period],
    queryFn: () => getIndicators(page, perPage, sector, period),
  });
}

export function useCreateIndicator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createIndicator,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['indicators'] }),
  });
}

export function useUpdateIndicator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<import('@/types').Indicator> }) => updateIndicator(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['indicators'] }),
  });
}

export function useDeleteIndicator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteIndicator,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['indicators'] }),
  });
}
