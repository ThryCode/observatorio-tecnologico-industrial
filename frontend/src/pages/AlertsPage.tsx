import PageHeader from '@/components/PageHeader';
import AlertList from '@/components/AlertList';
import { Button } from '@/components/ui/button';
import { Plus, Filter } from 'lucide-react';

const alerts = [
  { id: '1', priority: 'high' as const, title: 'Nueva patente en siderurgia detectada', description: 'Se registró una patente internacional en procesos de reducción directa.', time: 'Hace 2 horas', tag: { label: 'Patentes', variant: 'accent' as const } },
  { id: '2', priority: 'high' as const, title: 'Vencimiento de patente estratégica', description: 'La patente CU2024/0001 del sector biotecnológico expira en 15 días.', time: 'Hace 30 min', tag: { label: 'Urgente', variant: 'accent' as const } },
  { id: '3', priority: 'medium' as const, title: 'Actualización normativa sector químico', description: 'Nueva resolución sobre manejo de sustancias peligrosas publicada.', time: 'Hace 5 horas', tag: { label: 'Normativa', variant: 'info' as const } },
  { id: '4', priority: 'high' as const, title: 'Indicador de producción supera umbral', description: 'Índice de producción metalúrgica superó en 15% la meta trimestral.', time: 'Ayer', tag: { label: 'Indicadores', variant: 'gold' as const } },
  { id: '5', priority: 'low' as const, title: 'Nueva colaboración CTI identificada', description: 'Potencial sinergia entre ICT y EDI en desarrollo de sensores IoT.', time: 'Ayer', tag: { label: 'Red', variant: 'success' as const } },
  { id: '6', priority: 'medium' as const, title: 'Publicación científica relevante', description: 'Nuevo estudio sobre materiales compuestos para la industria azucarera.', time: 'Hace 2 días', tag: { label: 'Publicaciones', variant: 'info' as const } },
  { id: '7', priority: 'low' as const, title: 'Actualización de indicador económico', description: 'PIB del sector manufacturero presenta crecimiento moderado en Q2.', time: 'Hace 3 días', tag: { label: 'Economía', variant: 'success' as const } },
];

export default function AlertsPage() {
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
      <AlertList alerts={alerts} />
    </div>
  );
}
