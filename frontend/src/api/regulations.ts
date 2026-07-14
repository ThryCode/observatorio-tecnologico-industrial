import client, { USE_MOCK } from './client';
import type { Regulation, PaginatedResponse } from '@/types';

const MOCK_REGULATIONS: Regulation[] = [
  { id: '1', title: 'Reglamento de Seguridad Industrial', regulation_number: 'RES-2025-001', issuing_body: 'MINDUS', publication_date: '2025-01-15', category: 'resolution', summary: 'Normas de seguridad para instalaciones industriales.', sector_codigo: 'BIO', created_at: '2025-01-15T00:00:00Z', updated_at: '2025-01-15T00:00:00Z' },
  { id: '2', title: 'Ley de Innovacion Tecnologica', regulation_number: 'LEY-2025-002', issuing_body: 'Asamblea Nacional', publication_date: '2025-03-20', effective_date: '2025-06-01', category: 'law', summary: 'Marco legal para la innovacion tecnologica industrial.', created_at: '2025-03-20T00:00:00Z', updated_at: '2025-03-20T00:00:00Z' },
  { id: '3', title: 'Decreto de Propiedad Industrial', regulation_number: 'DEC-2025-003', issuing_body: 'Consejo de Ministros', publication_date: '2025-05-10', category: 'decree', summary: 'Regulacion de derechos de propiedad industrial.', created_at: '2025-05-10T00:00:00Z', updated_at: '2025-05-10T00:00:00Z' },
  { id: '4', title: 'Norma Tecnica de Biotecnologia', regulation_number: 'NC-2025-004', issuing_body: 'ONN', publication_date: '2025-04-05', effective_date: '2025-07-01', category: 'standard', summary: 'Requisitos tecnicos para productos biotecnologicos.', sector_codigo: 'BIO', created_at: '2025-04-05T00:00:00Z', updated_at: '2025-04-05T00:00:00Z' },
];

export async function getRegulations(
  page = 1,
  perPage = 20,
  category?: string,
): Promise<PaginatedResponse<Regulation>> {
  if (USE_MOCK) {
    let filtered = [...MOCK_REGULATIONS];
    if (category) filtered = filtered.filter((r) => r.category === category);
    return {
      items: filtered,
      total: filtered.length,
      page,
      per_page: perPage,
      total_pages: Math.ceil(filtered.length / perPage),
    };
  }
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  if (category) params.set('category', category);
  const res = await client.get<PaginatedResponse<Regulation>>(`/regulations?${params}`);
  return res.data;
}

export async function getRegulation(id: string): Promise<Regulation> {
  const res = await client.get<Regulation>(`/regulations/${id}`);
  return res.data;
}
