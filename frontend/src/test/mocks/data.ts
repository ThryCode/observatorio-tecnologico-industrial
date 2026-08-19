// Fixtures centralizados para los tests de hooks y páginas.
// Los nombres llevan prefijo `mock` para poder referenciarlos desde factories de vi.mock.

export const mockProfessionalsPage = {
  items: [{
    id: '1', full_name: 'Test User', username: 'test', email: 'test@test.com',
    profile: { especialidad: 'Test', grado_cientifico: '', user_id: '1', id: '1' },
  }],
  total: 1, page: 1, per_page: 20, total_pages: 1,
};

export const mockSpecialties = { items: ['Ingenieria', 'Biotecnologia'] };

export const mockAlerts = [
  { id: '1', titulo: 'Alert 1', descripcion: 'Desc', severidad: 'alta', fecha: '2026-07-20', sector: 'BIO', leida: false },
  { id: '2', titulo: 'Alert 2', descripcion: 'Desc', severidad: 'media', fecha: '2026-07-19', sector: 'ENE', leida: false },
  { id: '3', titulo: 'Alert 3', descripcion: 'Desc', severidad: 'baja', fecha: '2026-07-18', leida: true },
];

export const mockPatentsPage = {
  items: [{ id: '1', title: 'Patent 1' }], total: 1, page: 1, per_page: 20, total_pages: 1,
};

export const mockTechnologiesPage = {
  items: [{ id: '1', nombre: 'Tech 1' }], total: 1, page: 1, per_page: 20, total_pages: 1,
};

export const mockRegulationsPage = {
  items: [{ id: '1', title: 'Reg 1' }], total: 1, page: 1, per_page: 20, total_pages: 1,
};

export const mockIndicatorsPage = {
  items: [{ id: '1', name: 'Ind 1' }], total: 1, page: 1, per_page: 20, total_pages: 1,
};

export const mockOrganizationsPage = {
  items: [{ id: '1', nombre: 'Org 1' }], total: 1, page: 1, per_page: 20, total_pages: 1,
};

export const mockDashboardKPIs = [{ label: 'Patentes', value: 100, unit: 'registradas', change: 5 }];

export const mockTimelineEvents = [
  { id: '1', fecha: '2026-07-20T10:00:00Z', titulo: 'Event 1', tipo: 'patente' },
];

export const mockBulletinsPage = {
  items: [{ id: '1', titulo: 'Boletin 1' }], total: 1, page: 1, per_page: 20, total_pages: 1,
};

export const mockCompetitivenessData = {
  chartData: [{ sector: 'BIO', Cuba: 10 }],
  items: [{ id: '1', sector: 'BIO', sector_codigo: 'BIO', indicador: 'Test', valor: 10, pais: 'Cuba', periodo: '2025', fuente: null }],
  paises: ['Cuba'],
};

export const mockGraphStats = [{ label: 'Organizaciones', count: 10 }];

export const mockIndustrialSectorsPage = {
  items: [{ codigo: 'BIO', nombre: 'Bio' }], total: 1, page: 1, per_page: 20, total_pages: 1,
};

export const mockPatentMapsData = [{ tecnologia: 'AI', patentes: 100 }];

export const mockPublicationsPage = {
  items: [{ id: '1', titulo: 'Pub 1' }], total: 1, page: 1, per_page: 20, total_pages: 1,
};
