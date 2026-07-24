import client, { USE_MOCK } from './client';
import type { PatentMapSummary } from '@/types';

interface PatentMapApiResponse {
  tecnologia: string;
  patentes: number;
}

const MOCK_PATENT_MAPS: PatentMapApiResponse[] = [
  { tecnologia: 'Reducción Directa', patentes: 34 },
  { tecnologia: 'Sensores IoT', patentes: 28 },
  { tecnologia: 'Bioprocesos', patentes: 22 },
  { tecnologia: 'Energía Solar', patentes: 19 },
  { tecnologia: 'Materiales Compuestos', patentes: 15 },
  { tecnologia: 'Hidrógeno Verde', patentes: 12 },
  { tecnologia: 'Automatización', patentes: 10 },
  { tecnologia: 'Nanomateriales', patentes: 8 },
];

export async function getPatentMapSummary(): Promise<PatentMapApiResponse[]> {
  if (USE_MOCK) {
    return MOCK_PATENT_MAPS;
  }
  const res = await client.get<PatentMapApiResponse[]>('/patent-maps/summary');
  return res.data;
}
