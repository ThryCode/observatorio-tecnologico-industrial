import client, { USE_MOCK } from './client';
import type { DashboardKPI, TimelineEvent } from '@/types';

export interface SectorCountItem {
  codigo: string;
  nombre: string;
  count: number;
}

const MOCK_KPIS_BY_SECTOR: Record<string, DashboardKPI[]> = {
  all: [
    { label: 'Organizaciones', value: 42, unit: 'entidades', change: 0 },
    { label: 'Patentes', value: 156, unit: 'registradas', change: 12 },
    { label: 'Tecnologías', value: 28, unit: 'vigiladas', change: -3 },
    { label: 'Indicadores', value: 15, unit: 'activos', change: 5 },
  ],
  BIO: [
    { label: 'Organizaciones', value: 8, unit: 'entidades', change: 1 },
    { label: 'Patentes', value: 34, unit: 'registradas', change: 5 },
    { label: 'Tecnologías', value: 6, unit: 'vigiladas', change: 0 },
    { label: 'Indicadores', value: 3, unit: 'activos', change: 1 },
  ],
  ELE: [
    { label: 'Organizaciones', value: 10, unit: 'entidades', change: 2 },
    { label: 'Patentes', value: 42, unit: 'registradas', change: 3 },
    { label: 'Tecnologías', value: 7, unit: 'vigiladas', change: -1 },
    { label: 'Indicadores', value: 4, unit: 'activos', change: 0 },
  ],
  ENE: [
    { label: 'Organizaciones', value: 5, unit: 'entidades', change: 0 },
    { label: 'Patentes', value: 18, unit: 'registradas', change: 2 },
    { label: 'Tecnologías', value: 4, unit: 'vigiladas', change: 0 },
    { label: 'Indicadores', value: 2, unit: 'activos', change: 0 },
  ],
  MET: [
    { label: 'Organizaciones', value: 7, unit: 'entidades', change: 1 },
    { label: 'Patentes', value: 28, unit: 'registradas', change: 4 },
    { label: 'Tecnologías', value: 5, unit: 'vigiladas', change: -1 },
    { label: 'Indicadores', value: 3, unit: 'activos', change: 1 },
  ],
  QUI: [
    { label: 'Organizaciones', value: 6, unit: 'entidades', change: 0 },
    { label: 'Patentes', value: 22, unit: 'registradas', change: 2 },
    { label: 'Tecnologías', value: 3, unit: 'vigiladas', change: 0 },
    { label: 'Indicadores', value: 2, unit: 'activos', change: 0 },
  ],
  SID: [
    { label: 'Organizaciones', value: 6, unit: 'entidades', change: 0 },
    { label: 'Patentes', value: 12, unit: 'registradas', change: -2 },
    { label: 'Tecnologías', value: 3, unit: 'vigiladas', change: -1 },
    { label: 'Indicadores', value: 1, unit: 'activos', change: 0 },
  ],
};

const MOCK_TIMELINE: (TimelineEvent & { sector?: string })[] = [
  { id: '1', fecha: '2026-07-20T10:00:00Z', titulo: 'CIMAT cargó 23 nuevas patentes en el sector siderurgia', tipo: 'patente', sector: 'SID' },
  { id: '2', fecha: '2026-07-20T08:00:00Z', titulo: 'Alerta automática generada: disrupción en soldadura láser', tipo: 'alerta', sector: 'MET' },
  { id: '3', fecha: '2026-07-19T18:00:00Z', titulo: 'Boletín semanal enviado a 47 suscriptores', tipo: 'regulacion' },
  { id: '4', fecha: '2026-07-18T10:00:00Z', titulo: 'Nueva entidad CTI conectada: INIDT', tipo: 'indicador', sector: 'BIO' },
];

const MOCK_SECTORS: SectorCountItem[] = [
  { codigo: 'BIO', nombre: 'Biotecnologia', count: 5 },
  { codigo: 'ELE', nombre: 'Electronica', count: 8 },
  { codigo: 'ENE', nombre: 'Energia', count: 3 },
  { codigo: 'MET', nombre: 'Metalurgia', count: 6 },
  { codigo: 'QUI', nombre: 'Quimica', count: 4 },
  { codigo: 'SID', nombre: 'Siderurgia', count: 7 },
];

export async function getDashboardKPIs(sectorCodigos?: string): Promise<DashboardKPI[]> {
  if (USE_MOCK) {
    return MOCK_KPIS_BY_SECTOR[sectorCodigos || 'all'] || MOCK_KPIS_BY_SECTOR.all;
  }
  const params = sectorCodigos ? `?sector_codigos=${sectorCodigos}` : '';
  const res = await client.get<{ kpis: DashboardKPI[] }>(`/dashboard/summary${params}`);
  return res.data.kpis;
}

export async function getTimelineEvents(sectorCodigos?: string): Promise<TimelineEvent[]> {
  if (USE_MOCK) {
    if (!sectorCodigos) return MOCK_TIMELINE;
    const codes = sectorCodigos.split(',');
    return MOCK_TIMELINE.filter((e) => !e.sector || codes.includes(e.sector));
  }
  const params = sectorCodigos ? `?sector_codigos=${sectorCodigos}` : '';
  const res = await client.get<TimelineEvent[]>(`/dashboard/timeline${params}`);
  return res.data;
}

export async function getDashboardSectors(): Promise<SectorCountItem[]> {
  if (USE_MOCK) {
    return MOCK_SECTORS;
  }
  const res = await client.get<SectorCountItem[]>('/dashboard/sectors');
  return res.data;
}
