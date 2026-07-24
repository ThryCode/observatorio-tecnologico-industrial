import client, { USE_MOCK } from './client';
import type { Bulletin } from '@/types';

const MOCK_BULLETINS: Bulletin[] = [
  { id: '1', titulo: 'Boletín Trimestral de Ciencia y Tecnología — Q2 2026', resumen: 'Análisis exhaustivo de las tendencias tecnológicas emergentes en los sectores siderúrgico, metalúrgico y químico de la industria cubana.', fecha: '2026-07-01', categoria: 'boletin', autor: 'OCyT' },
  { id: '2', titulo: 'Estudio de Prospectiva: Inteligencia Artificial en la Industria Manufacturera', resumen: 'Evaluación del potencial de adopción de IA en los procesos productivos del sector industrial cubano a 2030.', fecha: '2026-06-01', categoria: 'estudio', autor: 'ICT' },
  { id: '3', titulo: 'Alerta Tecnológica: Nuevos Materiales para Almacenamiento de Hidrógeno', resumen: 'Detección temprana de innovaciones en materiales de hidruros metálicos con potencial aplicación en la industria energética nacional.', fecha: '2026-05-01', categoria: 'alerta', autor: 'CIB' },
  { id: '4', titulo: 'Mapa de Patentes: Tecnologías de Energía Renovable', resumen: 'Visualización y análisis de la actividad patentaria en energía solar, eólica y biomasa con relevancia para Cuba.', fecha: '2026-04-01', categoria: 'mapa', autor: 'EDI' },
  { id: '5', titulo: 'Boletín de Normalización Técnica — Julio 2026', resumen: 'Compendio mensual de nuevas normas ISO, NC y resoluciones técnicas aplicables a la industria.', fecha: '2026-07-01', categoria: 'boletin', autor: 'LMA' },
  { id: '6', titulo: 'Estudio de Competitividad: Sector Siderúrgico Cubano 2026', resumen: 'Benchmarking internacional y análisis FODA de la industria siderúrgica nacional frente a mercados clave.', fecha: '2026-03-01', categoria: 'estudio', autor: 'MINDUS' },
];

export async function listBulletins(): Promise<Bulletin[]> {
  if (USE_MOCK) {
    return MOCK_BULLETINS;
  }
  const res = await client.get<Bulletin[]>('/bulletins');
  return res.data;
}

export async function getBulletin(id: string): Promise<Bulletin> {
  if (USE_MOCK) {
    const bulletin = MOCK_BULLETINS.find(b => b.id === id);
    if (!bulletin) throw new Error('Bulletin not found');
    return bulletin;
  }
  const res = await client.get<Bulletin>(`/bulletins/${id}`);
  return res.data;
}
