import client from './client';

export interface PatentMapItem {
  id: string;
  tecnologia: string;
  pais: string;
  sector_codigo: string | null;
  total_patentes: number;
  periodo: string;
  tendencia: string;
}

export interface PatentMapChartRow {
  tecnologia: string;
  patentes: number;
}

export async function getPatentMapSummary(pais?: string, sectorCodigo?: string) {
  const params: Record<string, string> = {};
  if (pais) params.pais = pais;
  if (sectorCodigo) params.sector_codigo = sectorCodigo;
  const res = await client.get<PatentMapItem[]>('/patent-maps/summary', { params });
  return res.data;
}
