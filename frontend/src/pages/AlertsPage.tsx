import PageHeader from '@/components/PageHeader';
import AlertList from '@/components/AlertList';
import { Button } from '@/components/ui/button';
import { Plus, Filter } from 'lucide-react';
import { useAlerts } from '@/hooks/useAlerts';
import type { Alert } from '@/types';

function mapSeverityToPriority(severity: Alert['severidad']): 'high' | 'medium' | 'low' {
  switch (severity) {
    case 'alta':
      return 'high';
    case 'media':
      return 'medium';
    case 'baja':
      return 'low';
    default:
      return 'medium';
  }
}

function mapAlertToAlertItem(alert: Alert) {
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

export default function AlertsPage() {
  const { data: rawAlerts, isLoading } = useAlerts();
  const alerts = rawAlerts?.map(mapAlertToAlertItem) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alertas de Vigilancia"
        highlight="Alertas"
        description="Monitoreo automatizado de patentes, normativas, publicaciones y cambios en el ecosistema CTI."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Alerta
            </Button>
          </div>
        }
      />
      {isLoading ? (
        <div className="text-center text-text-muted py-8">Cargando alertas...</div>
      ) : (
        <AlertList alerts={alerts} />
      )}
    </div>
  );
}
