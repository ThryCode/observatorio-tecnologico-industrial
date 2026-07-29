import client from './client';
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

export async function getBulletin(id: string) {
  const res = await client.get<BulletinApiItem>(`/bulletins/${id}`);
  return mapBulletin(res.data);
}
