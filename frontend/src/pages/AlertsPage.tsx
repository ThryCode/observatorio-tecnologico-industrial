import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import AlertList from '@/components/AlertList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Filter } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useAlerts, useCreateAlert, useUpdateAlert, useDeleteAlert } from '@/hooks/useAlerts';
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
  const { can } = usePermissions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [deleteAlertId, setDeleteAlertId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ titulo: '', descripcion: '', severidad: 'media', fecha: '', sector: '' });

  const { data: rawAlerts, isLoading, refetch } = useAlerts();
  const createMutation = useCreateAlert();
  const updateMutation = useUpdateAlert();
  const deleteMutation = useDeleteAlert();

  const alerts = rawAlerts?.map(mapAlertToAlertItem) || [];

  const resetForm = () => {
    setFormData({ titulo: '', descripcion: '', severidad: 'media', fecha: new Date().toISOString().slice(0, 10), sector: '' });
  };

  const openCreate = () => {
    setEditingAlert(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (id: string) => {
    const alert = rawAlerts?.find((a) => a.id === id);
    if (!alert) return;
    setEditingAlert(alert);
    setFormData({
      titulo: alert.titulo,
      descripcion: alert.descripcion,
      severidad: alert.severidad,
      fecha: alert.fecha,
      sector: alert.sector || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const data: Partial<Alert> = {
      titulo: formData.titulo,
      descripcion: formData.descripcion,
      severidad: formData.severidad as Alert['severidad'],
      fecha: formData.fecha,
      sector: formData.sector || undefined,
    };
    if (editingAlert) {
      await updateMutation.mutateAsync({ id: editingAlert.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setDialogOpen(false);
    setEditingAlert(null);
    resetForm();
    refetch();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteAlertId) return;
    await deleteMutation.mutateAsync(deleteAlertId);
    setDeleteAlertId(null);
    refetch();
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

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
            {can('alerts', 'create') && (
              <Button className="gap-2" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Nueva Alerta
              </Button>
            )}
          </div>
        }
      />
      {isLoading ? (
        <div className="text-center text-text-muted py-8">Cargando alertas...</div>
      ) : (
        <AlertList
          alerts={alerts}
          onEdit={can('alerts', 'edit') ? openEdit : undefined}
          onDelete={can('alerts', 'delete') ? (id) => setDeleteAlertId(id) : undefined}
        />
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); setEditingAlert(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAlert ? 'Editar Alerta' : 'Nueva Alerta'}</DialogTitle>
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
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditingAlert(null); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!formData.titulo || isSaving}>
              {editingAlert ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteAlertId} onOpenChange={() => setDeleteAlertId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Alerta</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-text-muted">¿Estás seguro de que deseas eliminar esta alerta? Esta acción no se puede deshacer.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAlertId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}