import client, { USE_MOCK } from './client';
import type { DashboardKPI, TimelineEvent } from '@/types';

const MOCK_KPIS: DashboardKPI[] = [
  { label: 'Patentes Indexadas', value: 12847, unit: '', change: 14.3, icon: 'FileText' },
  { label: 'Publicaciones Científicas', value: 3421, unit: '', change: 8.7, icon: 'BookOpen' },
  { label: 'Entidades CTI Conectadas', value: 47, unit: '', change: 3, icon: 'Users' },
  { label: 'Alertas Activas', value: 7, unit: '', change: -2, icon: 'AlertTriangle' },
];

const MOCK_TIMELINE: TimelineEvent[] = [
  { id: '1', fecha: '2026-07-20T10:00:00Z', titulo: 'CIMAT cargó 23 nuevas patentes en el sector siderurgia', tipo: 'patente' },
  { id: '2', fecha: '2026-07-20T08:00:00Z', titulo: 'Alerta automática generada: disrupción en soldadura láser', tipo: 'alerta' },
  { id: '3', fecha: '2026-07-19T18:00:00Z', titulo: 'Boletín semanal enviado a 47 suscriptores', tipo: 'regulacion' },
  { id: '4', fecha: '2026-07-18T10:00:00Z', titulo: 'Nueva entidad CTI conectada: INIDT', tipo: 'indicador' },
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
