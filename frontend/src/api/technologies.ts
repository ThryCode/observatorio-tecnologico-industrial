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
  q?: string,
  trlNivel?: number,
  sortBy?: string,
  sortOrder?: string,
): Promise<PaginatedResponse<Technology>> {
  if (USE_MOCK) {
    let filtered = [...MOCK_TECHNOLOGIES];
    if (sector) filtered = filtered.filter((t) => t.sector_codigo === sector);
    if (q) {
      const term = q.toLowerCase();
      filtered = filtered.filter((t) =>
        t.nombre.toLowerCase().includes(term) ||
        (t.descripcion && t.descripcion.toLowerCase().includes(term))
      );
    }
    if (trlNivel !== undefined) filtered = filtered.filter((t) => t.trl_nivel === trlNivel);
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
  if (q) params.set('q', q);
  if (trlNivel !== undefined) params.set('trl_nivel', String(trlNivel));
  if (sortBy) params.set('sort_by', sortBy);
  if (sortOrder) params.set('sort_order', sortOrder);
  const res = await client.get<PaginatedResponse<Technology>>(`/technologies?${params}`);
  return res.data;
}

export async function createTechnology(data: Partial<Technology>): Promise<Technology> {
  if (USE_MOCK) {
    const newTech: Technology = { ...data, id: String(Date.now()), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Technology;
    MOCK_TECHNOLOGIES.unshift(newTech);
    return newTech;
  }
  const res = await client.post<Technology>('/technologies', data);
  return res.data;
}

export async function updateTechnology(id: string, data: Partial<Technology>): Promise<Technology> {
  if (USE_MOCK) {
    const idx = MOCK_TECHNOLOGIES.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Technology not found');
    MOCK_TECHNOLOGIES[idx] = { ...MOCK_TECHNOLOGIES[idx], ...data, updated_at: new Date().toISOString() };
    return MOCK_TECHNOLOGIES[idx];
  }
  const res = await client.put<Technology>(`/technologies/${id}`, data);
  return res.data;
}

export async function deleteTechnology(id: string): Promise<void> {
  if (USE_MOCK) {
    const idx = MOCK_TECHNOLOGIES.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Technology not found');
    MOCK_TECHNOLOGIES.splice(idx, 1);
    return;
  }
  await client.delete(`/technologies/${id}`);
}
