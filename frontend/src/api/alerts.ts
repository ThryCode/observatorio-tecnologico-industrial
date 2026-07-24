import client, { USE_MOCK } from './client';
import type { Alert } from '@/types';

const MOCK_ALERTS: Alert[] = [
  { id: '1', titulo: 'Nueva patente en biotecnología', descripcion: 'Se ha registrado una patente clave en el sector biotecnológico.', severidad: 'alta', fecha: '2026-07-20', sector: 'BIO', leida: false },
  { id: '2', titulo: 'Actualización regulatoria sector energético', descripcion: 'Nueva normativa para eficiencia energética publicada.', severidad: 'media', fecha: '2026-07-19', sector: 'ENE', leida: false },
  { id: '3', titulo: 'Indicador de innovación en ascenso', descripcion: 'El índice de innovación industrial subió 3 puntos este trimestre.', severidad: 'baja', fecha: '2026-07-18', leida: true },
  { id: '4', titulo: 'Tendencia: Automatización en manufactura', descripcion: 'La adopción de robots industriales crece un 15% anual en la región.', severidad: 'media', fecha: '2026-07-17', sector: 'IND', leida: false },
  { id: '5', titulo: 'Fondo de innovación disponible', descripcion: 'Nuevo fondo concursable para proyectos de I+D industrial.', severidad: 'alta', fecha: '2026-07-16', leida: false },
  { id: '6', titulo: 'Colaboración internacional en nanotecnología', descripcion: 'Acuerdo de cooperación en investigación de nanomateriales.', severidad: 'baja', fecha: '2026-07-15', sector: 'NAN', leida: true },
  { id: '7', titulo: 'Alerta: Ciberseguridad industrial', descripcion: 'Se detectó un aumento de ataques a sistemas SCADA en la región.', severidad: 'alta', fecha: '2026-07-14', leida: false },
];

export async function listAlerts(unreadOnly = false): Promise<Alert[]> {
  if (USE_MOCK) {
    if (unreadOnly) return MOCK_ALERTS.filter(a => !a.leida);
    return MOCK_ALERTS;
  }
  const params = unreadOnly ? '?unread_only=true' : '';
  const res = await client.get<Alert[]>(`/alerts${params}`);
  return res.data;
}

export async function getAlert(id: string): Promise<Alert> {
  if (USE_MOCK) {
    const alert = MOCK_ALERTS.find(a => a.id === id);
    if (!alert) throw new Error('Alert not found');
    return alert;
  }
  const res = await client.get<Alert>(`/alerts/${id}`);
  return res.data;
}

export async function markAlertRead(id: string): Promise<Alert> {
  if (USE_MOCK) {
    const alert = MOCK_ALERTS.find(a => a.id === id);
    if (!alert) throw new Error('Alert not found');
    alert.leida = true;
    return alert;
  }
  const res = await client.patch<Alert>(`/alerts/${id}/read`);
  return res.data;
}
