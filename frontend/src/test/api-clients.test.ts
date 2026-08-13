import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
  USE_MOCK: false,
}));

describe('professionals API client', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('listProfessionals calls GET with page and per_page', async () => {
    const client = (await import('@/api/client')).default;
    const { listProfessionals } = await import('@/api/professionals');
    await listProfessionals(1, 20);
    expect(client.get).toHaveBeenCalledWith(expect.stringContaining('page=1'));
  });

  it('listSpecialties calls GET', async () => {
    const client = (await import('@/api/client')).default;
    const { listSpecialties } = await import('@/api/professionals');
    await listSpecialties();
    expect(client.get).toHaveBeenCalledWith('/professionals/specialties');
  });
});

describe('alerts API client', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('listAlerts calls GET with unread_only param when unreadOnly=true', async () => {
    const client = (await import('@/api/client')).default;
    const { listAlerts } = await import('@/api/alerts');
    await listAlerts(true);
    expect(client.get).toHaveBeenCalledWith(expect.stringContaining('unread_only=true'));
  });

  it('listAlerts calls GET without unread_only param when unreadOnly=false', async () => {
    const client = (await import('@/api/client')).default;
    const { listAlerts } = await import('@/api/alerts');
    await listAlerts(false);
    expect(client.get).toHaveBeenCalledWith(expect.stringContaining('/alerts'));
  });
});

describe('patents API client', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('getPatents calls GET with page and per_page', async () => {
    const client = (await import('@/api/client')).default;
    const { getPatents } = await import('@/api/patents');
    await getPatents(1, 20);
    expect(client.get).toHaveBeenCalledWith(expect.stringContaining('page=1'));
  });

  it('createPatent calls POST', async () => {
    const client = (await import('@/api/client')).default;
    const { createPatent } = await import('@/api/patents');
    await createPatent({ title: 'Test' });
    expect(client.post).toHaveBeenCalledWith('/patents', { title: 'Test' });
  });

  it('updatePatent calls PUT with id', async () => {
    const client = (await import('@/api/client')).default;
    const { updatePatent } = await import('@/api/patents');
    await updatePatent('123', { title: 'Updated' });
    expect(client.put).toHaveBeenCalledWith('/patents/123', { title: 'Updated' });
  });

  it('deletePatent calls DELETE with id', async () => {
    const client = (await import('@/api/client')).default;
    const { deletePatent } = await import('@/api/patents');
    await deletePatent('123');
    expect(client.delete).toHaveBeenCalledWith('/patents/123');
  });
});

describe('technologies API client', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('getTechnologies calls GET with page and per_page', async () => {
    const client = (await import('@/api/client')).default;
    const { getTechnologies } = await import('@/api/technologies');
    await getTechnologies(1, 20);
    expect(client.get).toHaveBeenCalledWith(expect.stringContaining('page=1'));
  });

  it('createTechnology calls POST', async () => {
    const client = (await import('@/api/client')).default;
    const { createTechnology } = await import('@/api/technologies');
    await createTechnology({ nombre: 'Test' });
    expect(client.post).toHaveBeenCalledWith('/technologies', { nombre: 'Test' });
  });

  it('updateTechnology calls PUT with id', async () => {
    const client = (await import('@/api/client')).default;
    const { updateTechnology } = await import('@/api/technologies');
    await updateTechnology('123', { nombre: 'Updated' });
    expect(client.put).toHaveBeenCalledWith('/technologies/123', { nombre: 'Updated' });
  });

  it('deleteTechnology calls DELETE with id', async () => {
    const client = (await import('@/api/client')).default;
    const { deleteTechnology } = await import('@/api/technologies');
    await deleteTechnology('123');
    expect(client.delete).toHaveBeenCalledWith('/technologies/123');
  });
});

describe('regulations API client', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('getRegulations calls GET with page and per_page', async () => {
    const client = (await import('@/api/client')).default;
    const { getRegulations } = await import('@/api/regulations');
    await getRegulations(1, 20);
    expect(client.get).toHaveBeenCalledWith(expect.stringContaining('page=1'));
  });

  it('createRegulation calls POST', async () => {
    const client = (await import('@/api/client')).default;
    const { createRegulation } = await import('@/api/regulations');
    await createRegulation({ title: 'Test' });
    expect(client.post).toHaveBeenCalledWith('/regulations', { title: 'Test' });
  });

  it('updateRegulation calls PUT with id', async () => {
    const client = (await import('@/api/client')).default;
    const { updateRegulation } = await import('@/api/regulations');
    await updateRegulation('123', { title: 'Updated' });
    expect(client.put).toHaveBeenCalledWith('/regulations/123', { title: 'Updated' });
  });

  it('deleteRegulation calls DELETE with id', async () => {
    const client = (await import('@/api/client')).default;
    const { deleteRegulation } = await import('@/api/regulations');
    await deleteRegulation('123');
    expect(client.delete).toHaveBeenCalledWith('/regulations/123');
  });
});

describe('indicators API client', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('getIndicators calls GET with page and per_page', async () => {
    const client = (await import('@/api/client')).default;
    const { getIndicators } = await import('@/api/indicators');
    await getIndicators(1, 20);
    expect(client.get).toHaveBeenCalledWith(expect.stringContaining('page=1'));
  });

  it('createIndicator calls POST', async () => {
    const client = (await import('@/api/client')).default;
    const { createIndicator } = await import('@/api/indicators');
    await createIndicator({ name: 'Test' });
    expect(client.post).toHaveBeenCalledWith('/indicators', { name: 'Test' });
  });

  it('updateIndicator calls PUT with id', async () => {
    const client = (await import('@/api/client')).default;
    const { updateIndicator } = await import('@/api/indicators');
    await updateIndicator('123', { name: 'Updated' });
    expect(client.put).toHaveBeenCalledWith('/indicators/123', { name: 'Updated' });
  });

  it('deleteIndicator calls DELETE with id', async () => {
    const client = (await import('@/api/client')).default;
    const { deleteIndicator } = await import('@/api/indicators');
    await deleteIndicator('123');
    expect(client.delete).toHaveBeenCalledWith('/indicators/123');
  });
});

describe('organizations API client', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('getOrganizations calls GET with page and per_page', async () => {
    const client = (await import('@/api/client')).default;
    const { getOrganizations } = await import('@/api/organizations');
    await getOrganizations(1, 20);
    expect(client.get).toHaveBeenCalledWith(expect.stringContaining('page=1'));
  });

  it('createOrganization calls POST', async () => {
    const client = (await import('@/api/client')).default;
    const { createOrganization } = await import('@/api/organizations');
    await createOrganization({ nombre: 'Test' });
    expect(client.post).toHaveBeenCalledWith('/organizations', { nombre: 'Test' });
  });

  it('updateOrganization calls PUT with id', async () => {
    const client = (await import('@/api/client')).default;
    const { updateOrganization } = await import('@/api/organizations');
    await updateOrganization('123', { nombre: 'Updated' });
    expect(client.put).toHaveBeenCalledWith('/organizations/123', { nombre: 'Updated' });
  });

  it('deleteOrganization calls DELETE with id', async () => {
    const client = (await import('@/api/client')).default;
    const { deleteOrganization } = await import('@/api/organizations');
    await deleteOrganization('123');
    expect(client.delete).toHaveBeenCalledWith('/organizations/123');
  });
});

describe('dashboard API client', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('getDashboardKPIs calls GET on /dashboard/summary', async () => {
    const client = (await import('@/api/client')).default;
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { kpis: [] } });
    const { getDashboardKPIs } = await import('@/api/dashboard');
    await getDashboardKPIs();
    expect(client.get).toHaveBeenCalledWith(expect.stringContaining('/dashboard/summary'));
  });

  it('getTimelineEvents calls GET on /dashboard/timeline', async () => {
    const client = (await import('@/api/client')).default;
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });
    const { getTimelineEvents } = await import('@/api/dashboard');
    await getTimelineEvents();
    expect(client.get).toHaveBeenCalledWith(expect.stringContaining('/dashboard/timeline'));
  });
});

describe('industrialSectors API client', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('getIndustrialSectors calls GET with page and per_page', async () => {
    const client = (await import('@/api/client')).default;
    const { getIndustrialSectors } = await import('@/api/industrialSectors');
    await getIndustrialSectors(1, 20);
    expect(client.get).toHaveBeenCalledWith(expect.stringContaining('page=1'));
  });

  it('createIndustrialSector calls POST', async () => {
    const client = (await import('@/api/client')).default;
    const { createIndustrialSector } = await import('@/api/industrialSectors');
    await createIndustrialSector({ codigo: 'TIC', nombre: 'TI' });
    expect(client.post).toHaveBeenCalledWith('/industrial-sectors', { codigo: 'TIC', nombre: 'TI' });
  });

  it('updateIndustrialSector calls PUT with codigo', async () => {
    const client = (await import('@/api/client')).default;
    const { updateIndustrialSector } = await import('@/api/industrialSectors');
    await updateIndustrialSector('TIC', { nombre: 'Updated' });
    expect(client.put).toHaveBeenCalledWith('/industrial-sectors/TIC', { nombre: 'Updated' });
  });

  it('deleteIndustrialSector calls DELETE with codigo', async () => {
    const client = (await import('@/api/client')).default;
    const { deleteIndustrialSector } = await import('@/api/industrialSectors');
    await deleteIndustrialSector('TIC');
    expect(client.delete).toHaveBeenCalledWith('/industrial-sectors/TIC');
  });
});

describe('auth API client', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('login calls POST on /auth/login', async () => {
    const client = (await import('@/api/client')).default;
    const { login } = await import('@/api/auth');
    await login({ username: 'admin', password: 'pass' });
    expect(client.post).toHaveBeenCalledWith('/auth/login', { username: 'admin', password: 'pass' });
  });

  it('getMe calls GET on /auth/me', async () => {
    const client = (await import('@/api/client')).default;
    const { getMe } = await import('@/api/auth');
    await getMe();
    expect(client.get).toHaveBeenCalledWith('/auth/me');
  });

  it('registerPublic calls POST on /auth/register/public', async () => {
    const client = (await import('@/api/client')).default;
    const { registerPublic } = await import('@/api/auth');
    await registerPublic({ username: 'test', email: 't@t.com', password: 'pass', full_name: 'Test', role: 'profesional', job_title: 'Engineer' });
    expect(client.post).toHaveBeenCalledWith('/auth/register/public', expect.any(Object));
  });

  it('approveUser calls POST on /auth/{userId}/approve', async () => {
    const client = (await import('@/api/client')).default;
    const { approveUser } = await import('@/api/auth');
    await approveUser('123');
    expect(client.post).toHaveBeenCalledWith('/auth/123/approve');
  });

  it('rejectUser calls POST on /auth/{userId}/reject', async () => {
    const client = (await import('@/api/client')).default;
    const { rejectUser } = await import('@/api/auth');
    await rejectUser('123', { reason: 'Test' });
    expect(client.post).toHaveBeenCalledWith('/auth/123/reject', { reason: 'Test' });
  });
});

describe('bulletins API client', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('listBulletins calls GET on /bulletins', async () => {
    const client = (await import('@/api/client')).default;
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { items: [], total: 0 } });
    const { listBulletins } = await import('@/api/bulletins');
    await listBulletins(1, 20);
    expect(client.get).toHaveBeenCalledWith('/bulletins', expect.any(Object));
  });
});

describe('graph API client', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('getGraphStats calls GET on /graph/stats', async () => {
    const client = (await import('@/api/client')).default;
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { items: [] } });
    const { getGraphStats } = await import('@/api/graph');
    await getGraphStats();
    expect(client.get).toHaveBeenCalledWith(expect.stringContaining('/graph/stats'));
  });

  it('queryGraph calls GET on /graph/query', async () => {
    const client = (await import('@/api/client')).default;
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { nodes: [], edges: [] } });
    const { queryGraph } = await import('@/api/graph');
    await queryGraph();
    expect(client.get).toHaveBeenCalledWith(expect.stringContaining('/graph/query'));
  });

  it('searchGraphNodes calls GET on /graph/search', async () => {
    const client = (await import('@/api/client')).default;
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { items: [], total: 0 } });
    const { searchGraphNodes } = await import('@/api/graph');
    await searchGraphNodes('test');
    expect(client.get).toHaveBeenCalledWith(expect.stringContaining('/graph/search'));
  });

  it('exploreNode calls GET on /graph/explore', async () => {
    const client = (await import('@/api/client')).default;
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { nodes: [], edges: [] } });
    const { exploreNode } = await import('@/api/graph');
    await exploreNode('node-1');
    expect(client.get).toHaveBeenCalledWith(expect.stringContaining('/graph/explore'));
  });

  it('getEnterpriseGraph calls GET on /graph/enterprise', async () => {
    const client = (await import('@/api/client')).default;
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { nodes: [], edges: [] } });
    const { getEnterpriseGraph } = await import('@/api/graph');
    await getEnterpriseGraph();
    expect(client.get).toHaveBeenCalledWith('/graph/enterprise');
  });

  it('getOrgRecommendations calls GET on /graph/recommendations/{orgId}', async () => {
    const client = (await import('@/api/client')).default;
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { recommendations: [] } });
    const { getOrgRecommendations } = await import('@/api/graph');
    await getOrgRecommendations('org-1');
    expect(client.get).toHaveBeenCalledWith(expect.stringContaining('/graph/recommendations/org-1'));
  });
});

describe('patentMaps API client', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('getPatentMapSummary calls GET on /patent-maps/summary', async () => {
    const client = (await import('@/api/client')).default;
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });
    const { getPatentMapSummary } = await import('@/api/patentMaps');
    await getPatentMapSummary();
    expect(client.get).toHaveBeenCalledWith('/patent-maps/summary', expect.any(Object));
  });
});

describe('researchPublications API client', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('getResearchPublications calls GET with page and per_page', async () => {
    const client = (await import('@/api/client')).default;
    const { getResearchPublications } = await import('@/api/researchPublications');
    await getResearchPublications(1, 20);
    expect(client.get).toHaveBeenCalledWith(expect.stringContaining('page=1'));
  });

  it('createResearchPublication calls POST', async () => {
    const client = (await import('@/api/client')).default;
    const { createResearchPublication } = await import('@/api/researchPublications');
    await createResearchPublication({ titulo: 'Test' });
    expect(client.post).toHaveBeenCalledWith('/research-publications', { titulo: 'Test' });
  });

  it('updateResearchPublication calls PUT with id', async () => {
    const client = (await import('@/api/client')).default;
    const { updateResearchPublication } = await import('@/api/researchPublications');
    await updateResearchPublication('123', { titulo: 'Updated' });
    expect(client.put).toHaveBeenCalledWith('/research-publications/123', { titulo: 'Updated' });
  });

  it('deleteResearchPublication calls DELETE with id', async () => {
    const client = (await import('@/api/client')).default;
    const { deleteResearchPublication } = await import('@/api/researchPublications');
    await deleteResearchPublication('123');
    expect(client.delete).toHaveBeenCalledWith('/research-publications/123');
  });
});

describe('competitiveness API client', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('getCompetitivenessData calls GET on /competitiveness', async () => {
    const client = (await import('@/api/client')).default;
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { items: [] } });
    const { getCompetitivenessData } = await import('@/api/competitiveness');
    await getCompetitivenessData();
    expect(client.get).toHaveBeenCalledWith('/competitiveness', expect.any(Object));
  });
});
