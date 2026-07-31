import client, { USE_MOCK } from './client';
import type { ResearchPublication, PaginatedResponse } from '@/types';

const MOCK_PUBLICATIONS: ResearchPublication[] = [
  { id: '1', titulo: 'Modelo de optimización energética en procesos siderúrgicos mediante redes neuronales', autores: 'Rodríguez, C.; Pérez, M.; González, L.', resumen: 'Modelo basado en redes neuronales para optimizar consumo energético en hornos de arco eléctrico.', doi: '10.1234/steel.2026.001', journal: 'Revista Cubana de Ingeniería Industrial', fecha_publicacion: '2026-03-15T00:00:00Z', palabras_clave: ['redes neuronales', 'optimización energética', 'siderurgia', 'IA'], sector_codigo: 'SID', url: 'https://doi.org/10.1234/steel.2026.001', created_at: '2026-03-15T00:00:00Z', updated_at: '2026-03-15T00:00:00Z' },
  { id: '2', titulo: 'Bioprospección de microorganismos para biorremediación de efluentes metalúrgicos', autores: 'Martínez, A.; Fernández, R.; Díaz, T.', resumen: 'Cepas bacterianas nativas con capacidad de remover metales pesados en efluentes metalúrgicos.', doi: '10.1234/met.2026.008', journal: 'Biotecnología Aplicada', fecha_publicacion: '2026-05-20T00:00:00Z', palabras_clave: ['biorremediación', 'metales pesados', 'microorganismos'], sector_codigo: 'MET', url: 'https://doi.org/10.1234/met.2026.008', created_at: '2026-05-20T00:00:00Z', updated_at: '2026-05-20T00:00:00Z' },
  { id: '3', titulo: 'Desarrollo de un recubrimiento cerámico nanoestructurado para prótesis ortopédicas', autores: 'Sánchez, P.; Herrera, J.; Cruz, E.', resumen: 'Recubrimientos de hidroxiapatita nanoestructurada mediante deposición electroforética.', journal: 'Materiales y Biomateriales', fecha_publicacion: '2026-02-10T00:00:00Z', palabras_clave: ['nanotecnología', 'biomateriales', 'recubrimientos'], sector_codigo: 'BIO', created_at: '2026-02-10T00:00:00Z', updated_at: '2026-02-10T00:00:00Z' },
  { id: '4', titulo: 'Sistema de control predictivo para microrredes eléctricas con penetración renovable', autores: 'García, D.; López, S.; Torres, R.', resumen: 'Controlador MPC para gestión óptima de microrredes con alta penetración renovable.', doi: '10.1234/ele.2026.012', journal: 'Ingeniería Eléctrica y Automática', fecha_publicacion: '2026-07-05T00:00:00Z', palabras_clave: ['microrredes', 'control predictivo', 'energía renovable'], sector_codigo: 'ELE', url: 'https://doi.org/10.1234/ele.2026.012', created_at: '2026-07-05T00:00:00Z', updated_at: '2026-07-05T00:00:00Z' },
  { id: '5', titulo: 'Evaluación de la huella de carbono del biodiésel a partir de aceite de jatropha en Cuba', autores: 'Torres, M.; Ramírez, O.; Medina, J.', resumen: 'Análisis de ciclo de vida para evaluar huella de carbono del biodiésel en condiciones cubanas.', doi: '10.1234/qui.2026.005', journal: 'Revista Cubana de Química', fecha_publicacion: '2026-04-28T00:00:00Z', palabras_clave: ['biodiésel', 'huella de carbono', 'LCA', 'sostenibilidad'], sector_codigo: 'QUI', url: 'https://doi.org/10.1234/qui.2026.005', created_at: '2026-04-28T00:00:00Z', updated_at: '2026-04-28T00:00:00Z' },
  { id: '6', titulo: 'Arquitectura de control descentralizado para líneas de ensamblaje automotriz basada en ROS 2', autores: 'Díaz, L.; Fernández, A.; Pérez, G.', resumen: 'Arquitectura modular de control descentralizado utilizando ROS 2 para líneas de ensamblaje.', doi: '10.1234/aut.2026.009', journal: 'Automatización Industrial', fecha_publicacion: '2026-06-15T00:00:00Z', palabras_clave: ['ROS 2', 'control descentralizado', 'automotriz'], sector_codigo: 'AUT', created_at: '2026-06-15T00:00:00Z', updated_at: '2026-06-15T00:00:00Z' },
];

export async function getResearchPublications(
  page = 1,
  perPage = 20,
  sector?: string,
  q?: string,
  fechaDesde?: string,
  fechaHasta?: string,
  sortBy?: string,
  sortOrder?: string,
  mine?: boolean,
): Promise<PaginatedResponse<ResearchPublication>> {
  if (USE_MOCK) {
    let filtered = [...MOCK_PUBLICATIONS];
    if (sector) filtered = filtered.filter((p) => p.sector_codigo === sector);
    if (q) {
      const term = q.toLowerCase();
      filtered = filtered.filter((p) =>
        p.titulo.toLowerCase().includes(term) ||
        p.autores.toLowerCase().includes(term) ||
        (p.resumen && p.resumen.toLowerCase().includes(term))
      );
    }
    if (fechaDesde) {
      const d = new Date(fechaDesde);
      filtered = filtered.filter((p) => new Date(p.fecha_publicacion) >= d);
    }
    if (fechaHasta) {
      const d = new Date(fechaHasta);
      filtered = filtered.filter((p) => new Date(p.fecha_publicacion) <= d);
    }
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
  if (fechaDesde) params.set('fecha_desde', fechaDesde);
  if (fechaHasta) params.set('fecha_hasta', fechaHasta);
  if (sortBy) params.set('sort_by', sortBy);
  if (sortOrder) params.set('sort_order', sortOrder);
  if (mine) params.set('mine', 'true');
  const res = await client.get<PaginatedResponse<ResearchPublication>>(`/research-publications?${params}`);
  return res.data;
}

export async function createResearchPublication(data: Partial<ResearchPublication>): Promise<ResearchPublication> {
  if (USE_MOCK) {
    const newPub: ResearchPublication = { ...data, id: String(Date.now()), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as ResearchPublication;
    MOCK_PUBLICATIONS.unshift(newPub);
    return newPub;
  }
  const res = await client.post<ResearchPublication>('/research-publications', data);
  return res.data;
}

export async function updateResearchPublication(id: string, data: Partial<ResearchPublication>): Promise<ResearchPublication> {
  if (USE_MOCK) {
    const idx = MOCK_PUBLICATIONS.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Publication not found');
    MOCK_PUBLICATIONS[idx] = { ...MOCK_PUBLICATIONS[idx], ...data, updated_at: new Date().toISOString() };
    return MOCK_PUBLICATIONS[idx];
  }
  const res = await client.put<ResearchPublication>(`/research-publications/${id}`, data);
  return res.data;
}

export async function deleteResearchPublication(id: string): Promise<void> {
  if (USE_MOCK) {
    const idx = MOCK_PUBLICATIONS.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Publication not found');
    MOCK_PUBLICATIONS.splice(idx, 1);
    return;
  }
  await client.delete(`/research-publications/${id}`);
}
