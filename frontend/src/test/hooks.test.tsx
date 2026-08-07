import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const MOCK_PAGINATED = {
  items: [{ id: '1', nombre: 'Test' }],
  total: 1,
  page: 1,
  per_page: 20,
  total_pages: 1,
};

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
    const { result } = renderHook(() => useProfessionalList(1, 20), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.total).toBe(1);
  });
});

describe('useSpecialties', () => {
  it('returns specialties list', async () => {
    const { useSpecialties } = await import('@/hooks/useProfessionals');
    const { result } = renderHook(() => useSpecialties(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toContain('Ingenieria');
  });
});

const MOCK_ALERTS = [
  { id: '1', titulo: 'Alert 1', descripcion: 'Desc', severidad: 'alta', fecha: '2026-07-20', sector: 'BIO', leida: false },
  { id: '2', titulo: 'Alert 2', descripcion: 'Desc', severidad: 'media', fecha: '2026-07-19', sector: 'ENE', leida: false },
  { id: '3', titulo: 'Alert 3', descripcion: 'Desc', severidad: 'baja', fecha: '2026-07-18', leida: true },
];

vi.mock('@/api/alerts', () => ({
  listAlerts: vi.fn((unreadOnly: boolean) =>
    Promise.resolve(unreadOnly ? MOCK_ALERTS.filter(a => !a.leida) : MOCK_ALERTS),
  ),
  getAlert: vi.fn().mockResolvedValue(null),
  markAlertRead: vi.fn().mockResolvedValue({}),
}));

describe('useAlerts', () => {
  it('returns alerts list', async () => {
    const { useAlerts } = await import('@/hooks/useAlerts');
    const { result } = renderHook(() => useAlerts(false), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(3);
  });

  it('returns unread alerts only when unreadOnly=true', async () => {
    const { useAlerts } = await import('@/hooks/useAlerts');
    const { result } = renderHook(() => useAlerts(true), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.every(alert => !alert.leida)).toBe(true);
  });
});

vi.mock('@/api/patents', () => ({
  getPatents: vi.fn().mockResolvedValue({ items: [{ id: '1', title: 'Patent 1' }], total: 1, page: 1, per_page: 20, total_pages: 1 }),
  createPatent: vi.fn().mockResolvedValue({}),
  updatePatent: vi.fn().mockResolvedValue({}),
  deletePatent: vi.fn().mockResolvedValue(undefined),
}));

describe('usePatents', () => {
  it('returns patents list', async () => {
    const { usePatents } = await import('@/hooks/usePatents');
    const { result } = renderHook(() => usePatents(1, 20), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
  });
});

vi.mock('@/api/technologies', () => ({
  getTechnologies: vi.fn().mockResolvedValue({ items: [{ id: '1', nombre: 'Tech 1' }], total: 1, page: 1, per_page: 20, total_pages: 1 }),
  createTechnology: vi.fn().mockResolvedValue({}),
  updateTechnology: vi.fn().mockResolvedValue({}),
  deleteTechnology: vi.fn().mockResolvedValue(undefined),
}));

describe('useTechnologies', () => {
  it('returns technologies list', async () => {
    const { useTechnologies } = await import('@/hooks/useTechnologies');
    const { result } = renderHook(() => useTechnologies(1, 20), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
  });
});

vi.mock('@/api/regulations', () => ({
  getRegulations: vi.fn().mockResolvedValue({ items: [{ id: '1', title: 'Reg 1' }], total: 1, page: 1, per_page: 20, total_pages: 1 }),
  createRegulation: vi.fn().mockResolvedValue({}),
  updateRegulation: vi.fn().mockResolvedValue({}),
  deleteRegulation: vi.fn().mockResolvedValue(undefined),
}));

describe('useRegulations', () => {
  it('returns regulations list', async () => {
    const { useRegulations } = await import('@/hooks/useRegulations');
    const { result } = renderHook(() => useRegulations(1, 20), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
  });
});

vi.mock('@/api/indicators', () => ({
  getIndicators: vi.fn().mockResolvedValue({ items: [{ id: '1', name: 'Ind 1' }], total: 1, page: 1, per_page: 20, total_pages: 1 }),
  createIndicator: vi.fn().mockResolvedValue({}),
  updateIndicator: vi.fn().mockResolvedValue({}),
  deleteIndicator: vi.fn().mockResolvedValue(undefined),
}));

describe('useIndicators', () => {
  it('returns indicators list', async () => {
    const { useIndicators } = await import('@/hooks/useIndicators');
    const { result } = renderHook(() => useIndicators(1, 20), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
  });
});

vi.mock('@/api/organizations', () => ({
  getOrganizations: vi.fn().mockResolvedValue({ items: [{ id: '1', nombre: 'Org 1' }], total: 1, page: 1, per_page: 20, total_pages: 1 }),
  createOrganization: vi.fn().mockResolvedValue({}),
  updateOrganization: vi.fn().mockResolvedValue({}),
  deleteOrganization: vi.fn().mockResolvedValue(undefined),
}));

describe('useOrganizations', () => {
  it('returns organizations list', async () => {
    const { useOrganizations } = await import('@/hooks/useOrganizations');
    const { result } = renderHook(() => useOrganizations(1, 20), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
  });
});

vi.mock('@/api/dashboard', () => ({
  getDashboardKPIs: vi.fn().mockResolvedValue([{ label: 'Patentes', value: 100, unit: 'registradas', change: 5 }]),
  getTimelineEvents: vi.fn().mockResolvedValue([{ id: '1', fecha: '2026-07-20T10:00:00Z', titulo: 'Event 1', tipo: 'patente' }]),
}));

describe('useDashboardKPIs', () => {
  it('returns KPIs', async () => {
    const { useDashboardKPIs } = await import('@/hooks/useDashboard');
    const { result } = renderHook(() => useDashboardKPIs(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });
});

describe('useTimelineEvents', () => {
  it('returns timeline events', async () => {
    const { useTimelineEvents } = await import('@/hooks/useDashboard');
    const { result } = renderHook(() => useTimelineEvents(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });
});

vi.mock('@/api/bulletins', () => ({
  listBulletins: vi.fn().mockResolvedValue({ items: [{ id: '1', titulo: 'Boletin 1' }], total: 1, page: 1, per_page: 20, total_pages: 1 }),
}));

describe('useBulletins', () => {
  it('returns bulletins list', async () => {
    const { useBulletins } = await import('@/hooks/useBulletins');
    const { result } = renderHook(() => useBulletins(1, 20), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
  });
});

vi.mock('@/api/competitiveness', () => ({
  getCompetitivenessData: vi.fn().mockResolvedValue([{ sector: 'BIO', Cuba: 10 }]),
}));

describe('useCompetitiveness', () => {
  it('returns competitiveness data', async () => {
    const { useCompetitiveness } = await import('@/hooks/useCompetitiveness');
    const { result } = renderHook(() => useCompetitiveness(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });
});

vi.mock('@/api/graph', () => ({
  getGraphStats: vi.fn().mockResolvedValue([{ label: 'Organizaciones', count: 10 }]),
  searchGraphNodes: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  exploreNode: vi.fn().mockResolvedValue({ nodes: [], edges: [] }),
  queryGraph: vi.fn().mockResolvedValue({ nodes: [], edges: [] }),
  getEnterpriseGraph: vi.fn().mockResolvedValue({ nodes: [], edges: [] }),
  getOrgRecommendations: vi.fn().mockResolvedValue({ recommendations: [] }),
}));

describe('useGraphStats', () => {
  it('returns graph stats', async () => {
    const { useGraphStats } = await import('@/hooks/useGraph');
    const { result } = renderHook(() => useGraphStats(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });
});

describe('useEnterpriseGraph', () => {
  it('returns enterprise graph', async () => {
    const { useEnterpriseGraph } = await import('@/hooks/useGraph');
    const { result } = renderHook(() => useEnterpriseGraph(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });
});

vi.mock('@/api/industrialSectors', () => ({
  getIndustrialSectors: vi.fn().mockResolvedValue({ items: [{ codigo: 'BIO', nombre: 'Bio' }], total: 1, page: 1, per_page: 20, total_pages: 1 }),
  createIndustrialSector: vi.fn().mockResolvedValue({}),
  updateIndustrialSector: vi.fn().mockResolvedValue({}),
  deleteIndustrialSector: vi.fn().mockResolvedValue(undefined),
}));

describe('useIndustrialSectors', () => {
  it('returns industrial sectors', async () => {
    const { useIndustrialSectors } = await import('@/hooks/useIndustrialSectors');
    const { result } = renderHook(() => useIndustrialSectors(1, 20), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
  });
});

vi.mock('@/api/patentMaps', () => ({
  getPatentMapSummary: vi.fn().mockResolvedValue([{ tecnologia: 'AI', patentes: 100 }]),
}));

describe('usePatentMaps', () => {
  it('returns patent maps', async () => {
    const { usePatentMaps } = await import('@/hooks/usePatentMaps');
    const { result } = renderHook(() => usePatentMaps(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });
});

vi.mock('@/api/researchPublications', () => ({
  getResearchPublications: vi.fn().mockResolvedValue({ items: [{ id: '1', titulo: 'Pub 1' }], total: 1, page: 1, per_page: 20, total_pages: 1 }),
  createResearchPublication: vi.fn().mockResolvedValue({}),
  updateResearchPublication: vi.fn().mockResolvedValue({}),
  deleteResearchPublication: vi.fn().mockResolvedValue(undefined),
}));

describe('useResearchPublications', () => {
  it('returns research publications', async () => {
    const { useResearchPublications } = await import('@/hooks/useResearchPublications');
    const { result } = renderHook(() => useResearchPublications(1, 20), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
  });
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({ user: { role: 'admin_mindus' }, loginSuccess: vi.fn(), logout: vi.fn() }),
}));

describe('usePermissions', () => {
  it('returns can function with admin permissions', async () => {
    const { usePermissions } = await import('@/hooks/usePermissions');
    const { result } = renderHook(() => usePermissions(), { wrapper: createWrapper() });
    expect(result.current.role).toBe('admin_mindus');
    expect(result.current.can('patents', 'create')).toBe(true);
    expect(result.current.can('patents', 'delete')).toBe(true);
  });
});
