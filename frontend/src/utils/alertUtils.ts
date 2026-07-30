import type { Alert } from '@/types';

export function mapSeverityToPriority(severity: Alert['severidad']): 'high' | 'medium' | 'low' {
  switch (severity) {
    case 'alta': return 'high';
    case 'media': return 'medium';
    case 'baja': return 'low';
    default: return 'medium';
  }
}

export function mapAlertToAlertItem(alert: Alert) {
  return {
    id: alert.id,
    priority: mapSeverityToPriority(alert.severidad),
    title: alert.titulo,
    description: alert.descripcion,
    time: alert.fecha,
    tag: {
      label: alert.sector || 'General',
      variant: 'accent' as const,
    },
  };
}
