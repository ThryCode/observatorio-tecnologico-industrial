import type { Alert } from '@/types';

export function mapSeverityToPriority(severity: Alert['severidad']): 'high' | 'medium' | 'low' {
  switch (severity) {
    case 'alta': return 'high';
    case 'media': return 'medium';
    case 'baja': return 'low';
    default: return 'medium';
  }
}
