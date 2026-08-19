import client from './client';
import type { PaginatedResponse } from '@/types';

export interface CompetitivenessItem {
  id: string;
  sector: string;
  sector_codigo: string | null;
  indicador: string;
  valor: number;
  pais: string;
  periodo: string;
  fuente: string | null;
}

export interface CompetitivenessChartRow {
  sector: string;
  [pais: string]: string | number;
}

export interface CompetitivenessResult {
  chartData: CompetitivenessChartRow[];
  items: CompetitivenessItem[];
  paises: string[];
}

export async function getCompetitivenessData(
  periodo?: string,
  sectorCodigo?: string,
  q?: string,
  sortBy?: string,
  sortOrder?: string,
): Promise<CompetitivenessResult> {
  const params: Record<string, string> = { per_page: '100' };
  if (periodo) params.periodo = periodo;
  if (sectorCodigo) params.sector_codigo = sectorCodigo;
  if (q) params.q = q;
  if (sortBy) params.sort_by = sortBy;
  if (sortOrder) params.sort_order = sortOrder;
  const res = await client.get<PaginatedResponse<CompetitivenessItem>>('/competitiveness', { params });
  const items = res.data.items;

  const paises = [...new Set(items.map((i) => i.pais))];
  const sectores = [...new Set(items.map((i) => i.sector))];

  const chartData: CompetitivenessChartRow[] = sectores.map((sector) => {
    const row: CompetitivenessChartRow = { sector };
    paises.forEach((pais) => {
      const match = items.find((i) => i.sector === sector && i.pais === pais);
      row[pais] = match ? match.valor : 0;
    });
    return row;
  });

  return { chartData, items, paises };
}
