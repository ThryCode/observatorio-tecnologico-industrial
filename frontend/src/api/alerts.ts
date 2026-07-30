import client, { USE_MOCK } from './client';
import type { Alert } from '@/types';

const MOCK_ALERTS: Alert[] = [
  { id: '1', titulo: 'Nueva patente en biotecnología', descripcion: 'Se ha registrado una patente clave en el sector biotecnológico.', severidad: 'alta', fecha: '2026-07-20', sector_codigo: 'BIO', leida: false },
  { id: '2', titulo: 'Actualización regulatoria sector energético', descripcion: 'Nueva normativa para eficiencia energética publicada.', severidad: 'media', fecha: '2026-07-19', sector_codigo: 'ENE', leida: false },
  { id: '3', titulo: 'Indicador de innovación en ascenso', descripcion: 'El índice de innovación industrial subió 3 puntos este trimestre.', severidad: 'baja', fecha: '2026-07-18', leida: true },
  { id: '4', titulo: 'Tendencia: Automatización en manufactura', descripcion: 'La adopción de robots industriales crece un 15% anual en la región.', severidad: 'media', fecha: '2026-07-17', sector_codigo: 'MET', leida: false },
  { id: '5', titulo: 'Fondo de innovación disponible', descripcion: 'Nuevo fondo concursable para proyectos de I+D industrial.', severidad: 'alta', fecha: '2026-07-16', leida: false },
  { id: '6', titulo: 'Colaboración internacional en nanotecnología', descripcion: 'Acuerdo de cooperación en investigación de nanomateriales.', severidad: 'baja', fecha: '2026-07-15', sector_codigo: 'QUI', leida: true },
  { id: '7', titulo: 'Alerta: Ciberseguridad industrial', descripcion: 'Se detectó un aumento de ataques a sistemas SCADA en la región.', severidad: 'alta', fecha: '2026-07-14', leida: false },
  { id: '8', titulo: 'Electrónica: nuevo estándar de eficiencia', descripcion: 'Normativa ISO actualizada para componentes electrónicos industriales.', severidad: 'media', fecha: '2026-07-22', sector_codigo: 'ELE', leida: false },
  { id: '9', titulo: 'Metalurgia: avance en aleaciones ligeras', descripcion: 'Investigación cubana desarrolla nueva aleación de aluminio para la industria.', severidad: 'baja', fecha: '2026-07-21', sector_codigo: 'MET', leida: false },
  { id: '10', titulo: 'Química: método innovador de catálisis', descripcion: 'Nuevo catalizador reduce costos en procesos petroquímicos.', severidad: 'media', fecha: '2026-07-20', sector_codigo: 'QUI', leida: false },
  { id: '11', titulo: 'Siderurgia: actualización tecnológica', descripcion: 'Planta siderúrgica nacional incorpora horno de arco eléctrico de última generación.', severidad: 'alta', fecha: '2026-07-19', sector_codigo: 'SID', leida: true },
];

export async function listAlerts(
  unreadOnly = false,
  page = 1,
  perPage = 20,
  q?: string,
  severidad?: string,
  sector?: string,
  fechaDesde?: string,
  fechaHasta?: string,
  sortBy?: string,
  sortOrder?: string,
): Promise<Alert[]> {
  if (USE_MOCK) {
    let filtered = [...MOCK_ALERTS];
    if (unreadOnly) filtered = filtered.filter(a => !a.leida);
    if (q) {
      const term = q.toLowerCase();
      filtered = filtered.filter(a => a.titulo.toLowerCase().includes(term) || (a.descripcion && a.descripcion.toLowerCase().includes(term)));
    }
    if (severidad) filtered = filtered.filter(a => a.severidad === severidad);
    if (sector) filtered = filtered.filter(a => !a.sector_codigo || a.sector_codigo === sector);
    return filtered;
  }
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  if (unreadOnly) params.set('unread_only', 'true');
  if (q) params.set('q', q);
  if (severidad) params.set('severidad', severidad);
  if (sector) params.set('sector_codigo', sector);
  if (fechaDesde) params.set('fecha_desde', fechaDesde);
  if (fechaHasta) params.set('fecha_hasta', fechaHasta);
  if (sortBy) params.set('sort_by', sortBy);
  if (sortOrder) params.set('sort_order', sortOrder);
  const res = await client.get<{ items: Alert[] }>(`/alerts?${params}`);
  return res.data.items;
}

export async function markAllAlertsRead(): Promise<void> {
  if (USE_MOCK) {
    MOCK_ALERTS.forEach(a => { a.leida = true; });
    return;
  }
  await client.post('/alerts/read-all');
}

export async function createAlert(data: Partial<Alert>): Promise<Alert> {
  if (USE_MOCK) {
    const newAlert: Alert = { ...data, id: String(Date.now()), leida: false } as Alert;
    MOCK_ALERTS.unshift(newAlert);
    return newAlert;
  }
  const res = await client.post<Alert>('/alerts', data);
  return res.data;
}

export async function updateAlert(id: string, data: Partial<Alert>): Promise<Alert> {
  if (USE_MOCK) {
    const idx = MOCK_ALERTS.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Alert not found');
    MOCK_ALERTS[idx] = { ...MOCK_ALERTS[idx], ...data };
    return MOCK_ALERTS[idx];
  }
  const res = await client.put<Alert>(`/alerts/${id}`, data);
  return res.data;
}

export async function deleteAlert(id: string): Promise<void> {
  if (USE_MOCK) {
    const idx = MOCK_ALERTS.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Alert not found');
    MOCK_ALERTS.splice(idx, 1);
    return;
  }
  await client.delete(`/alerts/${id}`);
}
