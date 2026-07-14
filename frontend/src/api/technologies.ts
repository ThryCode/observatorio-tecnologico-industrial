import client, { USE_MOCK } from './client';
import type { Technology, PaginatedResponse } from '@/types';

const MOCK_TECHNOLOGIES: Technology[] = [
  { id: '1', nombre: 'Inteligencia Artificial Industrial', descripcion: 'Aplicacion de IA en procesos industriales', trl_nivel: 5, sector_codigo: 'TIC', palabras_clave: ['ia', 'manufactura', 'optimizacion'], created_at: '2025-06-01T00:00:00Z', updated_at: '2025-06-01T00:00:00Z' },
  { id: '2', nombre: 'Bioprocesos Enzimaticos', descripcion: 'Produccion de enzimas para la industria alimentaria', trl_nivel: 7, sector_codigo: 'BIO', palabras_clave: ['enzimas', 'biotecnologia', 'alimentos'], created_at: '2025-05-15T00:00:00Z', updated_at: '2025-05-15T00:00:00Z' },
  { id: '3', nombre: 'Sensores IoT para Manufactura', descripcion: 'Red de sensores para monitoreo de maquinaria', trl_nivel: 6, sector_codigo: 'TIC', palabras_clave: ['iot', 'sensores', 'manufactura'], created_at: '2025-04-20T00:00:00Z', updated_at: '2025-04-20T00:00:00Z' },
  { id: '4', nombre: 'Nanorecubrimientos Antibacteriales', descripcion: 'Recubrimientos a nanoescala para equipos medicos', trl_nivel: 4, palabras_clave: ['nanotecnologia', 'antibacterial'], created_at: '2025-03-10T00:00:00Z', updated_at: '2025-03-10T00:00:00Z' },
  { id: '5', nombre: 'Gemelos Digitales', descripcion: 'Simulacion virtual de procesos industriales', trl_nivel: 5, sector_codigo: 'TIC', palabras_clave: ['digital twin', 'simulacion'], created_at: '2025-02-01T00:00:00Z', updated_at: '2025-02-01T00:00:00Z' },
];

export async function getTechnologies(
  page = 1,
  perPage = 20,
  sector?: string,
): Promise<PaginatedResponse<Technology>> {
  if (USE_MOCK) {
    let filtered = [...MOCK_TECHNOLOGIES];
    if (sector) filtered = filtered.filter((t) => t.sector_codigo === sector);
    return {
      items: filtered,
      total: filtered.length,
      page,
      per_page: perPage,
      total_pages: Math.ceil(filtered.length / perPage),
    };
  }
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  if (sector) params.set('sector_codigo', sector);
  const res = await client.get<PaginatedResponse<Technology>>(`/technologies?${params}`);
  return res.data;
}

export async function getTechnology(id: string): Promise<Technology> {
  const res = await client.get<Technology>(`/technologies/${id}`);
  return res.data;
}
