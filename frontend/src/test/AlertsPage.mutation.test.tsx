import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { toast } from 'sonner';
import { AxiosError, type AxiosResponse } from 'axios';
import { renderWithProviders } from '@/test/test-utils';

const mockCreateAlert = vi.fn();
const mockUpdateAlert = vi.fn();
const mockDeleteAlert = vi.fn();
const mockMarkAllRead = vi.fn();

vi.mock('@/hooks/useAlerts', () => ({
  useAlerts: () => ({ data: [], isLoading: false }),
  useCreateAlert: () => ({ mutateAsync: mockCreateAlert, isPending: false }),
  useUpdateAlert: () => ({ mutateAsync: mockUpdateAlert, isPending: false }),
  useDeleteAlert: () => ({ mutateAsync: mockDeleteAlert, isPending: false }),
  useMarkAllAlertsRead: () => ({ mutate: mockMarkAllRead, isPending: false }),
}));

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: () => true }),
}));

vi.mock('@/api/industrialSectors', () => ({
  getIndustrialSectors: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, per_page: 100, total_pages: 0 }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import AlertsPage from '@/pages/AlertsPage';

function buildAxiosError(detail: string): AxiosError {
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status: 400,
    data: { detail },
  } as AxiosResponse);
}

async function openCreateDialog() {
  renderWithProviders(<AlertsPage />);
  fireEvent.click(screen.getByRole('button', { name: /Nueva Alerta/i }));
  await screen.findByRole('dialog');
}

describe('AlertsPage mutations', () => {
  beforeEach(() => {
    mockCreateAlert.mockReset();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('shows success toast when creating an alert', async () => {
    mockCreateAlert.mockResolvedValue({});
    await openCreateDialog();

    fireEvent.change(screen.getByLabelText('Título *'), { target: { value: 'Alerta de prueba' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    await waitFor(() => {
      expect(mockCreateAlert).toHaveBeenCalledWith(
        expect.objectContaining({ titulo: 'Alerta de prueba' }),
      );
    });
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Alerta creada correctamente');
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows error toast when the create mutation fails', async () => {
    mockCreateAlert.mockRejectedValue(buildAxiosError('El título ya existe'));
    await openCreateDialog();

    fireEvent.change(screen.getByLabelText('Título *'), { target: { value: 'Alerta duplicada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('El título ya existe');
    });
  });

  it('shows generic error toast for non-axios failures', async () => {
    mockCreateAlert.mockRejectedValue(new Error('network down'));
    await openCreateDialog();

    fireEvent.change(screen.getByLabelText('Título *'), { target: { value: 'Alerta sin red' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No se pudo guardar la alerta. Intenta de nuevo.');
    });
  });
});
