import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listAlerts, createAlert, updateAlert, deleteAlert } from '@/api/alerts';

export function useAlerts(unreadOnly = false) {
  return useQuery({
    queryKey: ['alerts', { unreadOnly }],
    queryFn: () => listAlerts(unreadOnly),
  });
}

export function useCreateAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAlert,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });
}

export function useUpdateAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<import('@/types').Alert> }) => updateAlert(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });
}

export function useDeleteAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAlert,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });
}
