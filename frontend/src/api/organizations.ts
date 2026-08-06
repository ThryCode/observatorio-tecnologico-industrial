import client, { USE_MOCK } from './client';
import type { Organization, PaginatedResponse, User } from '@/types';

const MOCK_ORGANIZATIONS: Organization[] = [
  {
    id: '1',
    nombre: 'Instituto de Ciencia y Tecnología',
    siglas: 'ICT',
    tipo: 'centro_investigacion',
    sector_codigo: 'SID',
    pais: 'Cuba',
    provincia: 'La Habana',
    sitio_web: 'https://ict.cu',
    email_contacto: 'contacto@ict.cu',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-06-01T10:00:00Z',
  },
  {
    id: '2',
    nombre: 'Empresa de Desarrollo Industrial',
    siglas: 'EDI',
    tipo: 'empresa',
    sector_codigo: 'MET',
    pais: 'Cuba',
    provincia: 'Villa Clara',
    sitio_web: 'https://edi.cu',
    email_contacto: 'info@edi.cu',
    created_at: '2024-02-20T10:00:00Z',
    updated_at: '2024-06-15T10:00:00Z',
  },
  {
    id: '3',
    nombre: 'Centro de Innovación Tecnológica',
    siglas: 'CIT',
    tipo: 'centro_investigacion',
    sector_codigo: 'ELE',
    pais: 'Cuba',
    provincia: 'Santiago de Cuba',
    created_at: '2024-03-10T10:00:00Z',
    updated_at: '2024-05-20T10:00:00Z',
  },
  {
    id: '4',
    nombre: 'Ministerio de Industrias',
    siglas: 'MINDUS',
    tipo: 'ministerio',
    sector_codigo: 'SID',
    pais: 'Cuba',
    provincia: 'La Habana',
    sitio_web: 'https://www.minem.gob.cu',
    email_contacto: 'info@mindus.gob.cu',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-06-20T10:00:00Z',
  },
  {
    id: '5',
    nombre: 'Centro de Estudios Ambientales',
    siglas: 'CEA',
    tipo: 'centro_investigacion',
    sector_codigo: 'QUI',
    pais: 'Cuba',
    provincia: 'Cienfuegos',
    created_at: '2024-04-05T10:00:00Z',
    updated_at: '2024-06-10T10:00:00Z',
  },
];

export async function createOrganization(data: Partial<Organization>): Promise<Organization> {
  if (USE_MOCK) {
    const newOrg: Organization = { ...data, id: String(Date.now()), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Organization;
    MOCK_ORGANIZATIONS.unshift(newOrg);
    return newOrg;
  }
  const res = await client.post<Organization>('/organizations', data);
  return res.data;
}

export async function updateOrganization(id: string, data: Partial<Organization>): Promise<Organization> {
  if (USE_MOCK) {
    const idx = MOCK_ORGANIZATIONS.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error('Organization not found');
    MOCK_ORGANIZATIONS[idx] = { ...MOCK_ORGANIZATIONS[idx], ...data, updated_at: new Date().toISOString() };
    return MOCK_ORGANIZATIONS[idx];
  }
  const res = await client.put<Organization>(`/organizations/${id}`, data);
  return res.data;
}

export async function deleteOrganization(id: string): Promise<void> {
  if (USE_MOCK) {
    const idx = MOCK_ORGANIZATIONS.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error('Organization not found');
    MOCK_ORGANIZATIONS.splice(idx, 1);
    return;
  }
  await client.delete(`/organizations/${id}`);
}

export async function getOrganizations(
  page = 1,
  perPage = 20,
  sectorCodigo?: string,
  q?: string,
  pais?: string,
  provincia?: string,
  sortBy?: string,
  sortOrder?: string,
): Promise<PaginatedResponse<Organization>> {
  if (USE_MOCK) {
    let filtered = [...MOCK_ORGANIZATIONS];
    if (sectorCodigo) {
      const codes = sectorCodigo.split(',');
      filtered = filtered.filter((o) => o.sector_codigo && codes.includes(o.sector_codigo));
    }
    if (q) {
      const term = q.toLowerCase();
      filtered = filtered.filter((o) =>
        o.nombre.toLowerCase().includes(term) || o.siglas.toLowerCase().includes(term)
      );
    }
    if (pais) filtered = filtered.filter((o) => o.pais === pais);
    if (provincia) filtered = filtered.filter((o) => o.provincia === provincia);
    return {
      items: filtered,
      total: filtered.length,
      page,
      per_page: perPage,
      total_pages: Math.ceil(filtered.length / perPage),
    };
  }
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  if (sectorCodigo) params.set('sector_codigos', sectorCodigo);
  if (q) params.set('q', q);
  if (pais) params.set('pais', pais);
  if (provincia) params.set('provincia', provincia);
  if (sortBy) params.set('sort_by', sortBy);
  if (sortOrder) params.set('sort_order', sortOrder);
  const res = await client.get<PaginatedResponse<Organization>>(`/organizations?${params}`);
  return res.data;
}
