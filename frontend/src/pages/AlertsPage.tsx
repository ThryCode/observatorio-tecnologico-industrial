import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import AlertList from '@/components/AlertList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useAlerts, useCreateAlert, useUpdateAlert, useDeleteAlert, useMarkAllAlertsRead } from '@/hooks/useAlerts';
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
import { mapAlertToAlertItem } from '@/utils/alertUtils';
import type { Alert } from '@/types';

export default function AlertsPage() {
  const { can } = usePermissions();
  const [q, setQ] = useState('');
  const [severidad, setSeveridad] = useState<string | undefined>();
  const [leidaFilter, setLeidaFilter] = useState<'todas' | 'no_leidas' | 'leidas'>('todas');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [proximasActive, setProximasActive] = useState(false);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string | undefined>('fecha');
  const [sortOrder, setSortOrder] = useState<string | undefined>('desc');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [deleteAlertId, setDeleteAlertId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ titulo: '', descripcion: '', severidad: 'media', fecha: '', sector: '' });
  const today = new Date().toISOString().slice(0, 10);
  const unreadOnly = leidaFilter === 'no_leidas';
  const { data: rawAlerts, isLoading, refetch } = useAlerts(unreadOnly, page, 10, q || undefined, severidad, undefined, fechaDesde || undefined, fechaHasta || undefined, sortBy, sortOrder);
  const allAlerts = Array.isArray(rawAlerts)
    ? leidaFilter === 'leidas' ? rawAlerts.filter(a => a.leida) : rawAlerts
    : [];
  const alerts = allAlerts.map(mapAlertToAlertItem);
  const markAllRead = useMarkAllAlertsRead();
  const createMutation = useCreateAlert();
  const updateMutation = useUpdateAlert();
  const deleteMutation = useDeleteAlert();

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
  };

  const handleDeleteConfirm = async () => {
    if (!deleteAlertId) return;
    await deleteMutation.mutateAsync(deleteAlertId);
    setDeleteAlertId(null);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alertas de Vigilancia"
        highlight="Alertas"
        description="Monitoreo automatizado de patentes, normativas, publicaciones y cambios en el ecosistema CTI."
        actions={
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar alertas..."
                className="pl-8"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Select value={leidaFilter} onValueChange={(v) => setLeidaFilter(v as 'todas' | 'no_leidas' | 'leidas')}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="no_leidas">No leídas</SelectItem>
                <SelectItem value="leidas">Leídas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severidad || 'todas'} onValueChange={(v) => setSeveridad(v === 'todas' ? undefined : v)}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Severidad" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Input type="date" className="w-[140px]" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} placeholder="Desde" />
              <span className="text-muted-foreground">-</span>
              <Input type="date" className="w-[140px]" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} placeholder="Hasta" />
            </div>
            <Button variant={proximasActive ? 'default' : 'outline'} size="sm" onClick={() => { setProximasActive(!proximasActive); setFechaDesde(proximasActive ? '' : today); setFechaHasta(''); setPage(1); }}>
              Próximas
            </Button>
            {Array.isArray(rawAlerts) && rawAlerts.some(a => !a.leida) && (
              <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
                {markAllRead.isPending ? 'Marcando...' : 'Marcar todas como leídas'}
              </Button>
            )}
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
      {!isLoading && allAlerts.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
            Anteriores
          </Button>
          <span className="text-sm text-text-muted">Página {page}</span>
          <Button variant="outline" size="sm" disabled={allAlerts.length < 10} onClick={() => setPage(p => p + 1)}>
            Siguientes
          </Button>
        </div>
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