import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('@/api/professionals', () => ({
  listProfessionals: vi.fn().mockResolvedValue({
    items: [{ id: '1', full_name: 'Test User', username: 'test', email: 'test@test.com', profile: { especialidad: 'Test', grado_cientifico: '', user_id: '1', id: '1' } }],
    total: 1, page: 1, per_page: 20, total_pages: 1,
  }),
  listSpecialties: vi.fn().mockResolvedValue({ items: ['Ingenieria', 'Biotecnologia'] }),
  getMyProfessionalProfile: vi.fn().mockResolvedValue(null),
  updateMyProfessionalProfile: vi.fn().mockResolvedValue({}),
}));

describe('useProfessionalList', () => {
  it('returns professional list', async () => {
    const { useProfessionalList } = await import('@/hooks/useProfessionals');

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useProfessionalList(1, 20), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.total).toBe(1);
  });
});

describe('useSpecialties', () => {
  it('returns specialties list', async () => {
    const { useSpecialties } = await import('@/hooks/useProfessionals');

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useSpecialties(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toContain('Ingenieria');
  });
});

vi.mock('@/api/alerts', () => ({
  listAlerts: vi.fn().mockResolvedValue([
    { id: '1', titulo: 'Nueva patente en biotecnología', descripcion: 'Se ha registrado una patente clave en el sector biotecnológico.', severidad: 'alta', fecha: '2026-07-20', sector: 'BIO', leida: false },
    { id: '2', titulo: 'Actualización regulatoria sector energético', descripcion: 'Nueva normativa para eficiencia energética publicada.', severidad: 'media', fecha: '2026-07-19', sector: 'ENE', leida: false },
    { id: '3', titulo: 'Indicador de innovación en ascenso', descripcion: 'El índice de innovación industrial subió 3 puntos este trimestre.', severidad: 'baja', fecha: '2026-07-18', leida: true },
  ]),
  getAlert: vi.fn().mockResolvedValue(null),
  markAlertRead: vi.fn().mockResolvedValue({}),
}));

describe('useAlerts', () => {
  it('returns alerts list', async () => {
    const { useAlerts } = await import('@/hooks/useAlerts');

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useAlerts(false), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(3);
  });

  it('returns unread alerts only when unreadOnly=true', async () => {
    const { useAlerts } = await import('@/hooks/useAlerts');

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useAlerts(true), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.every(alert => !alert.leida)).toBe(true);
  });
});