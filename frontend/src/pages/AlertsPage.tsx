import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import AlertList from '@/components/AlertList';
import EmptyState from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Bell, Calendar, Tag, AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useAlerts, useCreateAlert, useUpdateAlert, useDeleteAlert, useMarkAllAlertsRead, useMarkAlertRead } from '@/hooks/useAlerts';
import { getIndustrialSectors } from '@/api/industrialSectors';
import { useQuery } from '@tanstack/react-query';
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
import { Badge } from '@/components/ui/badge';
import { mapAlertToAlertItem } from '@/utils/alertUtils';
import type { Alert } from '@/types';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { queryKeys } from '@/lib/queryKeys';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AlertsPage() {
  const { can } = usePermissions();
  const { t } = useLanguage();
  const [q, setQ] = useState('');
  const [severidad, setSeveridad] = useState<string | undefined>();
  const [leidaFilter, setLeidaFilter] = useState<'todas' | 'no_leidas' | 'leidas'>('todas');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [proximasActive, setProximasActive] = useState(false);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [deleteAlertId, setDeleteAlertId] = useState<string | null>(null);
  const [detailAlert, setDetailAlert] = useState<Alert | null>(null);
  const [formData, setFormData] = useState({ titulo: '', descripcion: '', severidad: 'media', fecha: '', sector: '' });
  const today = new Date().toISOString().slice(0, 10);
  const unreadOnly = leidaFilter === 'no_leidas';
  const { data: rawAlerts, isLoading } = useAlerts(unreadOnly, page, 10, q || undefined, severidad, undefined, fechaDesde || undefined, fechaHasta || undefined);
  const { data: sectorsData } = useQuery({
    queryKey: queryKeys.industrialSectors.list(1, 100),
    queryFn: () => getIndustrialSectors(1, 100),
    staleTime: 10 * 60 * 1000,
  });
  const sectorOptions = (sectorsData?.items || []).map((s) => ({ value: s.codigo, label: s.nombre }));
  // TODO: backend solo expone `unread_only` (booleano); el filtro "solo leídas"
  // no es expresable server-side y se aplica en memoria sobre la página actual.
  const allAlerts = (rawAlerts?.items ?? []).filter((a) => leidaFilter !== 'leidas' || a.leida);
  const alerts = allAlerts.map(mapAlertToAlertItem);
  const markAllRead = useMarkAllAlertsRead();
  const markRead = useMarkAlertRead();
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
    const alert = rawAlerts?.items.find((a) => a.id === id);
    if (!alert) return;
    setEditingAlert(alert);
    setFormData({
      titulo: alert.titulo,
      descripcion: alert.descripcion,
      severidad: alert.severidad,
      fecha: alert.fecha,
      sector: alert.sector_codigo || '',
    });
    setDialogOpen(true);
  };

  const openDetail = (id: string) => {
    const alert = rawAlerts?.items.find((a) => a.id === id);
    if (!alert) return;
    setDetailAlert(alert);
    if (!alert.leida) {
      markRead.mutate(id);
    }
  };

  const handleSave = async () => {
    const data: Partial<Alert> = {
      titulo: formData.titulo,
      descripcion: formData.descripcion,
      severidad: formData.severidad as Alert['severidad'],
      fecha: formData.fecha,
      sector_codigo: formData.sector || undefined,
    };
    try {
      if (editingAlert) {
        await updateMutation.mutateAsync({ id: editingAlert.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      toast.success(editingAlert ? t('page.alerts.actualizadaCorrectamente') : t('page.alerts.creadaCorrectamente'));
      setDialogOpen(false);
      setEditingAlert(null);
      resetForm();
    } catch (error) {
      let message = t('page.alerts.noGuardar');
      if (error instanceof AxiosError && error.response?.data?.detail) {
        message = error.response.data.detail;
      }
      toast.error(message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteAlertId) return;
    try {
      await deleteMutation.mutateAsync(deleteAlertId);
      toast.success(t('page.alerts.eliminadaCorrectamente'));
      setDeleteAlertId(null);
    } catch (error) {
      let message = t('page.alerts.noEliminar');
      if (error instanceof AxiosError && error.response?.data?.detail) {
        message = error.response.data.detail;
      }
      toast.error(message);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('page.alerts.title')}
        highlight={t('page.alerts.title')}
        description={t('page.alerts.description')}
        actions={
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('page.alerts.buscarPlaceholder')}
                className="pl-8"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Select value={leidaFilter} onValueChange={(v) => setLeidaFilter(v as 'todas' | 'no_leidas' | 'leidas')}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder={t('page.alerts.estado')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">{t('page.alerts.todas')}</SelectItem>
                <SelectItem value="no_leidas">{t('page.alerts.noLeidas')}</SelectItem>
                <SelectItem value="leidas">{t('page.alerts.leidas')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severidad || 'todas'} onValueChange={(v) => setSeveridad(v === 'todas' ? undefined : v)}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder={t('page.alerts.severidad')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">{t('page.alerts.todas')}</SelectItem>
                <SelectItem value="alta">{t('page.alerts.alta')}</SelectItem>
                <SelectItem value="media">{t('page.alerts.media')}</SelectItem>
                <SelectItem value="baja">{t('page.alerts.baja')}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Input type="date" className="w-[140px]" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} placeholder="Desde" />
              <span className="text-muted-foreground">-</span>
              <Input type="date" className="w-[140px]" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} placeholder="Hasta" />
            </div>
            <Button variant={proximasActive ? 'default' : 'outline'} size="sm" onClick={() => { setProximasActive(!proximasActive); setFechaDesde(proximasActive ? '' : today); setFechaHasta(''); setPage(1); }}>
              {t('page.alerts.proximas')}
            </Button>
            {Array.isArray(rawAlerts?.items) && rawAlerts.items.some(a => !a.leida) && (
              <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
                {markAllRead.isPending ? t('page.alerts.marcando') : t('page.alerts.marcarTodasLeidas')}
              </Button>
            )}
            {can('alerts', 'create') && (
              <Button className="gap-2" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                {t('page.alerts.nuevaAlerta')}
              </Button>
            )}
          </div>
        }
      />
      {isLoading ? (
        <div className="rounded-lg border border-border bg-surface p-5">
          <TableSkeleton rows={6} />
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-surface rounded-lg border border-border">
          <EmptyState
            icon={<Bell className="h-10 w-10 text-text-muted" />}
            title={t('page.alerts.noHayAlertas')}
            description={t('page.alerts.noEncontradas')}
            action={can('alerts', 'create') ? { label: t('page.alerts.nuevaAlerta'), onClick: openCreate } : undefined}
          />
        </div>
      ) : (
        <AlertList
          alerts={alerts}
          onDetail={openDetail}
          onEdit={can('alerts', 'edit') ? openEdit : undefined}
          onDelete={can('alerts', 'delete') ? (id) => setDeleteAlertId(id) : undefined}
        />
      )}
      {!isLoading && allAlerts.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
            {t('common.anteriores')}
          </Button>
          <span className="text-sm text-text-muted">{t('common.pagina')} {page} {t('common.de')} {Math.max(1, rawAlerts?.total_pages ?? 1)}</span>
          <Button variant="outline" size="sm" disabled={page >= (rawAlerts?.total_pages ?? 1)} onClick={() => setPage(p => p + 1)}>
            {t('common.siguientes')}
          </Button>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); setEditingAlert(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAlert ? t('common.editar') + ' ' + t('page.alerts.alerta') : t('page.alerts.nuevaAlerta')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="alert-titulo" className="text-sm font-medium">{t('page.alerts.titulo')} *</label>
              <Input id="alert-titulo" value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} placeholder="Título de la alerta" />
            </div>
            <div>
              <label htmlFor="alert-descripcion" className="text-sm font-medium">{t('page.alerts.descripcion')}</label>
              <textarea
                id="alert-descripcion"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción de la alerta"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t('page.alerts.severidad')}</label>
              <Select value={formData.severidad} onValueChange={(v) => setFormData({ ...formData, severidad: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">{t('page.alerts.alta')}</SelectItem>
                  <SelectItem value="media">{t('page.alerts.media')}</SelectItem>
                  <SelectItem value="baja">{t('page.alerts.baja')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="alert-fecha" className="text-sm font-medium">{t('page.alerts.fecha')}</label>
              <Input id="alert-fecha" type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">{t('common.sector')}</label>
              <Select value={formData.sector || 'general'} onValueChange={(v) => setFormData({ ...formData, sector: v === 'general' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder={t('page.alerts.seleccionarSector')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">{t('page.alerts.general')}</SelectItem>
                  {sectorOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditingAlert(null); resetForm(); }}>{t('common.cancelar')}</Button>
            <Button onClick={handleSave} disabled={!formData.titulo || isSaving}>
              {editingAlert ? t('common.guardar') : t('common.crear')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteAlertId} onOpenChange={() => setDeleteAlertId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('page.alerts.eliminarAlerta')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-text-muted">{t('page.alerts.seguroEliminar')} {t('common.accionNoSePuedeDeshacer')}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAlertId(null)}>{t('common.cancelar')}</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>{t('common.eliminar')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailAlert} onOpenChange={() => setDetailAlert(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {detailAlert?.severidad === 'alta' && <AlertTriangle className="h-5 w-5 text-danger" />}
              {detailAlert?.severidad === 'media' && <AlertCircle className="h-5 w-5 text-warning" />}
              {detailAlert?.severidad === 'baja' && <Info className="h-5 w-5 text-info" />}
              {detailAlert?.titulo}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Calendar className="h-4 w-4" />
              <span>{detailAlert?.fecha}</span>
              {detailAlert?.leida && (
                <Badge variant="secondary" className="ml-2">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Leída
                </Badge>
              )}
            </div>
            {detailAlert?.sector_codigo && (
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <Tag className="h-4 w-4" />
                <span>Sector: {detailAlert.sector_codigo}</span>
              </div>
            )}
            <div className="pt-2 border-t border-border">
              <p className="text-sm text-foreground whitespace-pre-wrap">{detailAlert?.descripcion || 'Sin descripción'}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailAlert(null)}>Cerrar</Button>
            {can('alerts', 'edit') && (
              <Button onClick={() => { setDetailAlert(null); openEdit(detailAlert?.id || ''); }}>Editar</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}