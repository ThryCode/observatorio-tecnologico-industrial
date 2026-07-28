import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import AlertList from '@/components/AlertList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Filter } from 'lucide-react';
import { useAlerts, useCreateAlert, useDeleteAlert } from '@/hooks/useAlerts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Alert } from '@/types';

function mapSeverityToPriority(severity: Alert['severidad']): 'high' | 'medium' | 'low' {
  switch (severity) {
    case 'alta': return 'high';
    case 'media': return 'medium';
    case 'baja': return 'low';
    default: return 'medium';
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ titulo: '', descripcion: '', severidad: 'media', fecha: '', sector: '' });

  const { data: rawAlerts, isLoading, refetch } = useAlerts();
  const createMutation = useCreateAlert();
  const deleteMutation = useDeleteAlert();

  const alerts = rawAlerts?.map(mapAlertToAlertItem) || [];

  const resetForm = () => {
    setFormData({ titulo: '', descripcion: '', severidad: 'media', fecha: new Date().toISOString().slice(0, 10), sector: '' });
  };

  const handleCreate = async () => {
    const data: Partial<Alert> = {
      titulo: formData.titulo,
      descripcion: formData.descripcion,
      severidad: formData.severidad as Alert['severidad'],
      fecha: formData.fecha,
      sector: formData.sector || undefined,
    };
    await createMutation.mutateAsync(data);
    setDialogOpen(false);
    resetForm();
    refetch();
  };

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
            <Button className="gap-2" onClick={() => { resetForm(); setDialogOpen(true); }}>
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

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Alerta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título *</label>
              <Input value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} placeholder="Título de la alerta" />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción de la alerta"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Severidad</label>
              <Select value={formData.severidad} onValueChange={(v) => setFormData({ ...formData, severidad: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Fecha</label>
              <Input type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Sector</label>
              <Input value={formData.sector} onChange={(e) => setFormData({ ...formData, sector: e.target.value })} placeholder="Sector (opcional)" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!formData.titulo || createMutation.isPending}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}