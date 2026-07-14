import client, { USE_MOCK } from './client';
import type { Indicator, PaginatedResponse } from '@/types';

const MOCK_INDICATORS: Indicator[] = [
  { id: '1', name: 'Indice de Produccion Industrial', code: 'IPI-2025', description: 'Indice mensual de produccion industrial', unit: 'porcentaje', value: 102.5, source: 'ONEI', period: 'monthly', sector_codigo: 'BIO', date: '2025-06-01', created_at: '2025-06-01T00:00:00Z', updated_at: '2025-06-01T00:00:00Z' },
  { id: '2', name: 'Exportaciones de Alta Tecnologia', code: 'EXP-2025', description: 'Exportaciones del sector de alta tecnologia', unit: 'millones USD', value: 45.2, source: 'ONEI', period: 'quarterly', sector_codigo: 'TIC', date: '2025-04-01', created_at: '2025-04-01T00:00:00Z', updated_at: '2025-04-01T00:00:00Z' },
  { id: '3', name: 'Inversion en I+D', code: 'ID-2025', description: 'Inversion en investigacion y desarrollo', unit: 'porcentaje PIB', value: 1.8, source: 'MINDUS', period: 'yearly', date: '2025-01-01', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: '4', name: 'Patentes Solicitadas', code: 'PAT-2025', description: 'Solicitudes de patentes del sector industrial', unit: 'unidades', value: 156, source: 'OCPI', period: 'monthly', date: '2025-06-01', created_at: '2025-06-01T00:00:00Z', updated_at: '2025-06-01T00:00:00Z' },
  { id: '5', name: 'Tasa de Innovacion Empresarial', code: 'TIE-2025', description: 'Porcentaje de empresas que introdujeron innovaciones', unit: 'porcentaje', value: 34.7, source: 'MINDUS', period: 'yearly', date: '2025-01-01', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
];

export async function getIndicators(
  page = 1,
  perPage = 20,
  sector?: string,
  period?: string,
): Promise<PaginatedResponse<Indicator>> {
  if (USE_MOCK) {
    let filtered = [...MOCK_INDICATORS];
    if (sector) filtered = filtered.filter((i) => i.sector_codigo === sector);
    if (period) filtered = filtered.filter((i) => i.period === period);
    return {
      items: filtered,
      total: filtered.length,
      page,
      per_page: perPage,
      total_pages: Math.ceil(filtered.length / perPage),
    };
  }
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  if (sector) params.set('sector', sector);
  if (period) params.set('period', period);
  const res = await client.get<PaginatedResponse<Indicator>>(`/indicators?${params}`);
  return res.data;
}

export async function getIndicator(id: string): Promise<Indicator> {
  const res = await client.get<Indicator>(`/indicators/${id}`);
  return res.data;
}
