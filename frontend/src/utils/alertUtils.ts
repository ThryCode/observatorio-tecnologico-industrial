import type { Alert } from '@/types';

export function mapSeverityToPriority(severity: Alert['severidad']): 'high' | 'medium' | 'low' {
  switch (severity) {
    case 'alta': return 'high';
    case 'media': return 'medium';
    case 'baja': return 'low';
    default: return 'medium';
  }
}

const sectorVariant: Record<string, 'accent' | 'info' | 'gold' | 'success' | 'default'> = {
  BIO: 'success',
  ELE: 'info',
  ENE: 'gold',
  MET: 'default',
  QUI: 'accent',
  SID: 'info',
};

export function mapAlertToAlertItem(alert: Alert) {
  const sector = alert.sector_codigo;
  return {
    id: alert.id,
    priority: mapSeverityToPriority(alert.severidad),
    title: alert.titulo,
    description: alert.descripcion,
    time: alert.fecha,
    tag: {
      label: sector || 'General',
      variant: sector ? (sectorVariant[sector] || 'accent') : 'accent',
    },
  };
}
