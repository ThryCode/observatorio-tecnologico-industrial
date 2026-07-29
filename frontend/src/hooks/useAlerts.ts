import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listAlerts, createAlert, updateAlert, deleteAlert, markAllAlertsRead } from '@/api/alerts';

export function useAlerts(unreadOnly = false, page = 1, perPage = 20, q?: string, severidad?: string, sector?: string, fechaDesde?: string, fechaHasta?: string, sortBy?: string, sortOrder?: string) {
  return useQuery({
    queryKey: ['alerts', { unreadOnly, page, perPage, q, severidad, sector, fechaDesde, fechaHasta, sortBy, sortOrder }],
    queryFn: () => listAlerts(unreadOnly, page, perPage, q, severidad, sector, fechaDesde, fechaHasta, sortBy, sortOrder),
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

export function useMarkAllAlertsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllAlertsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });
}
