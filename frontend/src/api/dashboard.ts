import client, { USE_MOCK } from './client';
import type { DashboardKPI, TimelineEvent } from '@/types';

export interface SectorCountItem {
  codigo: string;
  nombre: string;
  count: number;
}

const MOCK_KPIS: DashboardKPI[] = [
  { label: 'Organizaciones', value: 5, unit: 'entidades', change: 0, icon: 'Users' },
  { label: 'Patentes', value: 6, unit: 'registradas', change: 0, icon: 'FileText' },
  { label: 'Tecnologías', value: 0, unit: 'vigiladas', change: 0, icon: 'BookOpen' },
  { label: 'Indicadores', value: 0, unit: 'activos', change: 0, icon: 'AlertTriangle' },
];

const MOCK_TIMELINE: TimelineEvent[] = [
  { id: '1', fecha: '2026-07-20T10:00:00Z', titulo: 'CIMAT cargó 23 nuevas patentes en el sector siderurgia', tipo: 'patente' },
  { id: '2', fecha: '2026-07-20T08:00:00Z', titulo: 'Alerta automática generada: disrupción en soldadura láser', tipo: 'alerta' },
  { id: '3', fecha: '2026-07-19T18:00:00Z', titulo: 'Boletín semanal enviado a 47 suscriptores', tipo: 'regulacion' },
  { id: '4', fecha: '2026-07-18T10:00:00Z', titulo: 'Nueva entidad CTI conectada: INIDT', tipo: 'indicador' },
];

const MOCK_SECTORS: SectorCountItem[] = [
  { codigo: 'BIO', nombre: 'Biotecnologia', count: 5 },
  { codigo: 'ELE', nombre: 'Electronica', count: 8 },
  { codigo: 'ENE', nombre: 'Energia', count: 3 },
  { codigo: 'MET', nombre: 'Metalurgia', count: 6 },
  { codigo: 'QUI', nombre: 'Quimica', count: 4 },
  { codigo: 'SID', nombre: 'Siderurgia', count: 7 },
];

export async function getDashboardKPIs(): Promise<DashboardKPI[]> {
  if (USE_MOCK) {
    return MOCK_KPIS;
  }
  const res = await client.get<{ kpis: DashboardKPI[] }>('/dashboard/summary');
  return res.data.kpis;
}

export async function getTimelineEvents(): Promise<TimelineEvent[]> {
  if (USE_MOCK) {
    return MOCK_TIMELINE;
  }
  const res = await client.get<TimelineEvent[]>('/dashboard/timeline');
  return res.data;
}

export async function getDashboardSectors(): Promise<SectorCountItem[]> {
  if (USE_MOCK) {
    return MOCK_SECTORS;
  }
  const res = await client.get<SectorCountItem[]>('/dashboard/sectors');
  return res.data;
}
