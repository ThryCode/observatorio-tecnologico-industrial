import client, { USE_MOCK } from './client';
import type { IndustrialSector, PaginatedResponse } from '@/types';

const MOCK_SECTORS: IndustrialSector[] = [
  { codigo: 'BIO', nombre: 'Biotecnologia', descripcion: 'Sector biotecnologico industrial', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { codigo: 'TIC', nombre: 'Tecnologias de la Informacion', descripcion: 'Sector TIC industrial', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { codigo: 'NAN', nombre: 'Nanotecnologia', descripcion: 'Sector nanotecnologico', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { codigo: 'ENE', nombre: 'Energia', descripcion: 'Sector energetico industrial', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
];

export async function getIndustrialSectors(
  page = 1,
  perPage = 20,
): Promise<PaginatedResponse<IndustrialSector>> {
  if (USE_MOCK) {
    const start = (page - 1) * perPage;
    const items = MOCK_SECTORS.slice(start, start + perPage);
    return {
      items,
      total: MOCK_SECTORS.length,
      page,
      per_page: perPage,
      total_pages: Math.ceil(MOCK_SECTORS.length / perPage),
    };
  }
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  const res = await client.get<PaginatedResponse<IndustrialSector>>(`/industrial-sectors?${params}`);
  return res.data;
}
