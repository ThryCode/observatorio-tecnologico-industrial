import client, { USE_MOCK } from './client';
import type { CompetitivenessData } from '@/types';

interface CompetitivenessApiResponse {
  sector: string;
  Cuba: number;
  Chile: number;
  México: number;
  Brasil: number;
}

const MOCK_COMPETITIVENESS: CompetitivenessApiResponse[] = [
  { sector: 'Siderurgia', Cuba: 42, Chile: 78, México: 65, Brasil: 91 },
  { sector: 'Metalurgia', Cuba: 38, Chile: 72, México: 58, Brasil: 85 },
  { sector: 'Química', Cuba: 55, Chile: 60, México: 70, Brasil: 88 },
  { sector: 'Electrónica', Cuba: 28, Chile: 55, México: 62, Brasil: 70 },
  { sector: 'Biotecnología', Cuba: 72, Chile: 45, México: 50, Brasil: 68 },
  { sector: 'Energía', Cuba: 35, Chile: 68, México: 55, Brasil: 80 },
];

export async function getCompetitivenessData(): Promise<CompetitivenessApiResponse[]> {
  if (USE_MOCK) {
    return MOCK_COMPETITIVENESS;
  }
  const res = await client.get<CompetitivenessApiResponse[]>('/competitiveness');
  return res.data;
}
