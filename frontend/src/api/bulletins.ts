import client, { USE_MOCK } from './client';
import type { PaginatedResponse } from '@/types';

export interface BulletinApiItem {
  id: string;
  titulo: string;
  resumen: string | null;
  fecha_publicacion: string;
  categoria: string;
  autor: string | null;
  archivo_url: string | null;
  sector_codigo: string | null;
}

export interface BulletinListItem {
  id: string;
  titulo: string;
  resumen: string;
  fecha: string;
  categoria: string;
  autor?: string;
  url?: string;
}

const MOCK_BULLETINS: BulletinApiItem[] = [
  { id: '1', titulo: 'Boletín trimestral de biotecnología', resumen: 'Resumen de avances en biotecnología industrial cubana.', fecha_publicacion: '2026-07-15', categoria: 'boletin', autor: 'MINDUS', archivo_url: null, sector_codigo: 'BIO' },
  { id: '2', titulo: 'Estudio de prospectiva energética 2030', resumen: 'Escenarios energéticos para la industria cubana en la próxima década.', fecha_publicacion: '2026-07-10', categoria: 'estudio', autor: 'INIDT', archivo_url: null, sector_codigo: 'ENE' },
  { id: '3', titulo: 'Alerta: disrupción en sensores IoT', resumen: 'Nueva tecnología de sensores que podría afectar la manufactura electrónica.', fecha_publicacion: '2026-07-08', categoria: 'alerta', autor: 'Sistema', archivo_url: null, sector_codigo: 'ELE' },
  { id: '4', titulo: 'Mapa de patentes en metalurgia 2026', resumen: 'Panorama global de patentes en aleaciones y procesos metalúrgicos.', fecha_publicacion: '2026-07-05', categoria: 'mapa', autor: 'OCPI', archivo_url: null, sector_codigo: 'MET' },
  { id: '5', titulo: 'Boletín de innovación química', resumen: 'Novedades en procesos catalíticos y materiales avanzados.', fecha_publicacion: '2026-07-01', categoria: 'boletin', autor: 'MINDUS', archivo_url: null, sector_codigo: 'QUI' },
  { id: '6', titulo: 'Estudio de cadena de valor del acero', resumen: 'Análisis de la cadena de valor siderúrgica en Cuba.', fecha_publicacion: '2026-06-28', categoria: 'estudio', autor: 'INIDT', archivo_url: null, sector_codigo: 'SID' },
  { id: '7', titulo: 'Panorama tecnológico general', resumen: 'Resumen ejecutivo de tendencias tecnológicas intersectoriales.', fecha_publicacion: '2026-06-25', categoria: 'boletin', autor: 'Observatorio', archivo_url: null, sector_codigo: null },
];

function mapBulletin(item: BulletinApiItem): BulletinListItem {
  return {
    id: item.id,
    titulo: item.titulo,
    resumen: item.resumen || '',
    fecha: item.fecha_publicacion.slice(0, 10),
    categoria: item.categoria,
    autor: item.autor || undefined,
    url: item.archivo_url || undefined,
  };
}

export async function listBulletins(
  page = 1,
  perPage = 20,
  sectorCodigo?: string,
  categoria?: string,
  q?: string,
  fechaDesde?: string,
  fechaHasta?: string,
  sortBy?: string,
  sortOrder?: string,
) {
  if (USE_MOCK) {
    let filtered = [...MOCK_BULLETINS];
    if (sectorCodigo) filtered = filtered.filter((b) => !b.sector_codigo || b.sector_codigo === sectorCodigo);
    if (categoria) filtered = filtered.filter((b) => b.categoria === categoria);
    if (q) {
      const term = q.toLowerCase();
      filtered = filtered.filter((b) => b.titulo.toLowerCase().includes(term) || (b.resumen && b.resumen.toLowerCase().includes(term)));
    }
    const start = (page - 1) * perPage;
    const items = filtered.slice(start, start + perPage).map(mapBulletin);
    return { items, total: filtered.length, page, per_page: perPage, total_pages: Math.ceil(filtered.length / perPage) };
  }
  const params: Record<string, string | number> = { page, per_page: perPage };
  if (sectorCodigo) params.sector_codigo = sectorCodigo;
  if (categoria) params.categoria = categoria;
  if (q) params.q = q;
  if (fechaDesde) params.fecha_desde = fechaDesde;
  if (fechaHasta) params.fecha_hasta = fechaHasta;
  if (sortBy) params.sort_by = sortBy;
  if (sortOrder) params.sort_order = sortOrder;
  const res = await client.get<PaginatedResponse<BulletinApiItem>>('/bulletins', { params });
  return {
    ...res.data,
    items: res.data.items.map(mapBulletin),
  };
}

export async function createBulletin(data: {
  titulo: string;
  resumen?: string;
  fecha_publicacion: string;
  categoria: string;
  autor?: string;
  archivo_url?: string;
  sector_codigo?: string;
}) {
  const res = await client.post<BulletinApiItem>('/bulletins', {
    ...data,
    fecha_publicacion: new Date(data.fecha_publicacion).toISOString(),
  });
  return mapBulletin(res.data);
}

export async function updateBulletin(
  id: string,
  data: {
    titulo?: string;
    resumen?: string;
    fecha_publicacion?: string;
    categoria?: string;
    autor?: string;
    archivo_url?: string;
    sector_codigo?: string;
  },
) {
  const payload: Record<string, unknown> = { ...data };
  if (data.fecha_publicacion) {
    payload.fecha_publicacion = new Date(data.fecha_publicacion).toISOString();
  }
  const res = await client.put<BulletinApiItem>(`/bulletins/${id}`, payload);
  return mapBulletin(res.data);
}

export async function deleteBulletin(id: string) {
  await client.delete(`/bulletins/${id}`);
}


