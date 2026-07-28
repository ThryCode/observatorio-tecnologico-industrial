import { useState } from 'react';
import { useIndicators, useCreateIndicator, useUpdateIndicator, useDeleteIndicator } from '@/hooks/useIndicators';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, TrendingUp, ExternalLink, Plus, Pencil, Trash2 } from 'lucide-react';
import { formatDate, formatNumber } from '@/utils/formatters';
import { usePermissions } from '@/hooks/usePermissions';
import type { Indicator } from '@/types';

const periodLabels: Record<string, string> = {
  monthly: 'Mensual', quarterly: 'Trimestral', yearly: 'Anual',
};

export default function Indicators() {
  const { can } = usePermissions();
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Indicator | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingInd, setEditingInd] = useState<Indicator | null>(null);
  const [indToDelete, setIndToDelete] = useState<Indicator | null>(null);
  const [formData, setFormData] = useState({
    name: '', code: '', description: '', unit: '', value: '', source: '', period: '', sector_codigo: '', date: '',
  });

  const createMutation = useCreateIndicator();
  const updateMutation = useUpdateIndicator();
  const deleteMutation = useDeleteIndicator();

  const { data, isLoading, refetch } = useIndicators(page, 20, undefined, period || undefined);

  const filtered = data?.items.filter(
    (item) => !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.code.toLowerCase().includes(search.toLowerCase()),
  );

  const resetForm = () => {
    setFormData({ name: '', code: '', description: '', unit: '', value: '', source: '', period: '', sector_codigo: '', date: '' });
    setEditingInd(null);
  };

  const openCreateDialog = () => { resetForm(); setDialogOpen(true); };

  const openEditDialog = (item: Indicator) => {
    setEditingInd(item);
    setFormData({
      name: item.name, code: item.code, description: item.description || '', unit: item.unit,
      value: String(item.value), source: item.source, period: item.period,
      sector_codigo: item.sector_codigo || '', date: item.date,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const data: Partial<Indicator> = {
      name: formData.name, code: formData.code, description: formData.description || undefined,
      unit: formData.unit, value: Number(formData.value), source: formData.source,
      period: formData.period as import('@/types').IndicatorPeriod, sector_codigo: formData.sector_codigo || undefined, date: formData.date,
    };
    if (editingInd) {
      await updateMutation.mutateAsync({ id: editingInd.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setDialogOpen(false);
    resetForm();
    refetch();
  };

  const handleDelete = async () => {
    if (!indToDelete) return;
    await deleteMutation.mutateAsync(indToDelete.id);
    setDeleteDialogOpen(false);
    setIndToDelete(null);
    if (selected?.id === indToDelete.id) setSelected(null);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Indicadores</h2>
          <p className="text-muted-foreground">Indicadores de ciencia, tecnología e innovación del sector industrial.</p>
        </div>
        {can('indicators', 'create') && (
          <Button className="gap-2" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            Nuevo Indicador
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar indicadores..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Periodo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="monthly">Mensual</SelectItem>
            <SelectItem value="quarterly">Trimestral</SelectItem>
            <SelectItem value="yearly">Anual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Fuente</TableHead>
                <TableHead className="w-[120px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : filtered?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <button className="hover:underline text-left" onClick={() => setSelected(item)}>{item.name}</button>
                      </TableCell>
                      <TableCell><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{item.code}</code></TableCell>
                      <TableCell className="font-semibold">{formatNumber(item.value)}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell><Badge variant="outline">{periodLabels[item.period] || item.period}</Badge></TableCell>
                      <TableCell>{item.source}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {can('indicators', 'edit') && (
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}><Pencil className="h-4 w-4" /></Button>
                          )}
                          {can('indicators', 'delete') && (
                            <Button variant="ghost" size="sm" onClick={() => { setIndToDelete(item); setDeleteDialogOpen(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => setSelected(item)}><ExternalLink className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selected && !dialogOpen && !deleteDialogOpen} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Valor:</span>
                <span className="text-xl font-bold">{formatNumber(selected.value)}</span>
                <span className="text-muted-foreground">{selected.unit}</span>
              </div>
              {selected.description && <p className="text-sm text-muted-foreground">{selected.description}</p>}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Código:</span><p className="text-muted-foreground">{selected.code}</p></div>
                <div><span className="font-medium">Periodo:</span><p className="text-muted-foreground">{periodLabels[selected.period]}</p></div>
                <div><span className="font-medium">Fuente:</span><p className="text-muted-foreground">{selected.source}</p></div>
                <div><span className="font-medium">Fecha:</span><p className="text-muted-foreground">{formatDate(selected.date)}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingInd ? 'Editar Indicador' : 'Nuevo Indicador'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium">Nombre *</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nombre del indicador" />
            </div>
            <div>
              <label className="text-sm font-medium">Código *</label>
              <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="IPI-2025" />
            </div>
            <div>
              <label className="text-sm font-medium">Valor *</label>
              <Input type="number" step="any" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} placeholder="0" />
            </div>
            <div>
              <label className="text-sm font-medium">Unidad</label>
              <Input value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="porcentaje" />
            </div>
            <div>
              <label className="text-sm font-medium">Fuente</label>
              <Input value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} placeholder="ONEI" />
            </div>
            <div>
              <label className="text-sm font-medium">Periodo</label>
              <Select value={formData.period} onValueChange={(v) => setFormData({ ...formData, period: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar periodo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Fecha</label>
              <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Descripción</label>
              <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descripción del indicador" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!formData.name || !formData.code || !formData.value || createMutation.isPending || updateMutation.isPending}>
              {editingInd ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>¿Está seguro de eliminar el indicador &quot;{indToDelete?.name}&quot;? Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Página {page} de {data.total_pages} ({data.total} total)</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={page >= data.total_pages} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
          </div>
        </div>
      )}
    </div>
  );
}