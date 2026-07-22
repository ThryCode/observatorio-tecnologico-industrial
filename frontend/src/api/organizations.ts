import client, { USE_MOCK } from './client';
import type { Organization, PaginatedResponse } from '@/types';

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

export async function getOrganizations(
  page = 1,
  perPage = 20,
  sectorCodigo?: string,
): Promise<PaginatedResponse<Organization>> {
  if (USE_MOCK) {
    const filtered = sectorCodigo
      ? MOCK_ORGANIZATIONS.filter((o) => o.sector_codigo === sectorCodigo)
      : MOCK_ORGANIZATIONS;
    return {
      items: filtered,
      total: filtered.length,
      page,
      per_page: perPage,
      total_pages: Math.ceil(filtered.length / perPage),
    };
  }
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  if (sectorCodigo) params.set('sector_codigo', sectorCodigo);
  const res = await client.get<PaginatedResponse<Organization>>(`/organizations?${params}`);
  return res.data;
}
