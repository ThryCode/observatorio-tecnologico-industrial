import client from './client';
import type { PaginatedResponse } from '@/types';

interface CompetitivenessApiItem {
  id: string;
  sector: string;
  sector_codigo: string | null;
  indicador: string;
  valor: number;
  pais: string;
  periodo: string;
  fuente: string | null;
}

interface CompetitivenessChartRow {
  sector: string;
  [pais: string]: string | number;
}

export async function getCompetitivenessData(periodo?: string) {
  const params: Record<string, string> = {};
  if (periodo) params.periodo = periodo;
  const res = await client.get<PaginatedResponse<CompetitivenessApiItem>>('/competitiveness', { params });
  const items = res.data.items;

  const paises = [...new Set(items.map(i => i.pais))];
  const sectores = [...new Set(items.map(i => i.sector))];

  const chartData: CompetitivenessChartRow[] = sectores.map(sector => {
    const row: CompetitivenessChartRow = { sector };
    paises.forEach(pais => {
      const match = items.find(i => i.sector === sector && i.pais === pais);
      row[pais] = match ? match.valor : 0;
    });
    return row;
  });

  return chartData;
}
