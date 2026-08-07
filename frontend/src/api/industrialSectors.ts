import client, { USE_MOCK } from './client';
import type { IndustrialSector, PaginatedResponse } from '@/types';

const MOCK_SECTORS: IndustrialSector[] = [
  { codigo: 'BIO', nombre: 'Biotecnologia', descripcion: 'Sector biotecnologico industrial', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { codigo: 'ELE', nombre: 'Electronica', descripcion: 'Sector electronico industrial', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { codigo: 'ENE', nombre: 'Energia', descripcion: 'Sector energetico industrial', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { codigo: 'MET', nombre: 'Metalurgia', descripcion: 'Sector metalurgico industrial', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { codigo: 'QUI', nombre: 'Quimica', descripcion: 'Sector quimico industrial', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { codigo: 'SID', nombre: 'Siderurgia', descripcion: 'Sector siderurgico industrial', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
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

export async function createIndustrialSector(data: { codigo: string; nombre: string; descripcion?: string }): Promise<IndustrialSector> {
  if (USE_MOCK) {
    const now = new Date().toISOString();
    return { ...data, descripcion: data.descripcion || '', created_at: now, updated_at: now };
  }
  const res = await client.post<IndustrialSector>('/industrial-sectors', data);
  return res.data;
}

export async function updateIndustrialSector(codigo: string, data: { nombre?: string; descripcion?: string }): Promise<IndustrialSector> {
  if (USE_MOCK) {
    const existing = MOCK_SECTORS.find((s) => s.codigo === codigo);
    if (!existing) throw new Error('Not found');
    return { ...existing, ...data, updated_at: new Date().toISOString() };
  }
  const res = await client.put<IndustrialSector>(`/industrial-sectors/${codigo}`, data);
  return res.data;
}

export async function deleteIndustrialSector(codigo: string): Promise<void> {
  if (USE_MOCK) return;
  await client.delete(`/industrial-sectors/${codigo}`);
}
