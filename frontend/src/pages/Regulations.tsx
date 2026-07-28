import { useState } from 'react';
import { useRegulations, useCreateRegulation, useUpdateRegulation, useDeleteRegulation } from '@/hooks/useRegulations';
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
import { Search, FileText, ExternalLink, Calendar, Plus, Pencil, Trash2 } from 'lucide-react';
import { formatDate } from '@/utils/formatters';
import { usePermissions } from '@/hooks/usePermissions';
import type { Regulation } from '@/types';

const categoryLabels: Record<string, string> = {
  law: 'Ley', decree: 'Decreto', resolution: 'Resolución', standard: 'Norma', other: 'Otro',
};

const categoryVariants: Record<string, string> = {
  law: 'destructive', decree: 'default', resolution: 'secondary', standard: 'outline', other: 'default',
};

export default function Regulations() {
  const { can } = usePermissions();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Regulation | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingReg, setEditingReg] = useState<Regulation | null>(null);
  const [regToDelete, setRegToDelete] = useState<Regulation | null>(null);
  const [formData, setFormData] = useState({
    title: '', regulation_number: '', issuing_body: '', publication_date: '',
    effective_date: '', category: '', summary: '', sector_codigo: '',
  });

  const createMutation = useCreateRegulation();
  const updateMutation = useUpdateRegulation();
  const deleteMutation = useDeleteRegulation();

  const { data, isLoading, refetch } = useRegulations(page, 20, category || undefined);

  const filtered = data?.items.filter(
    (item) => !search || item.title.toLowerCase().includes(search.toLowerCase()) || item.regulation_number.toLowerCase().includes(search.toLowerCase()),
  );

  const resetForm = () => {
    setFormData({ title: '', regulation_number: '', issuing_body: '', publication_date: '', effective_date: '', category: '', summary: '', sector_codigo: '' });
    setEditingReg(null);
  };

  const openCreateDialog = () => { resetForm(); setDialogOpen(true); };

  const openEditDialog = (reg: Regulation) => {
    setEditingReg(reg);
    setFormData({
      title: reg.title, regulation_number: reg.regulation_number, issuing_body: reg.issuing_body,
      publication_date: reg.publication_date, effective_date: reg.effective_date || '',
      category: reg.category, summary: reg.summary || '', sector_codigo: reg.sector_codigo || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const data: Partial<Regulation> = {
      ...formData,
      category: formData.category as import('@/types').RegulationCategory,
      effective_date: formData.effective_date || undefined,
      summary: formData.summary || undefined,
      sector_codigo: formData.sector_codigo || undefined,
    };
    if (editingReg) {
      await updateMutation.mutateAsync({ id: editingReg.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setDialogOpen(false);
    resetForm();
    refetch();
  };

  const handleDelete = async () => {
    if (!regToDelete) return;
    await deleteMutation.mutateAsync(regToDelete.id);
    setDeleteDialogOpen(false);
    setRegToDelete(null);
    if (selected?.id === regToDelete.id) setSelected(null);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Normativas</h2>
          <p className="text-muted-foreground">Marco legal y normativo del ecosistema industrial.</p>
        </div>
        {can('regulations', 'create') && (
          <Button className="gap-2" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            Nueva Normativa
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar normativas..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="law">Ley</SelectItem>
            <SelectItem value="decree">Decreto</SelectItem>
            <SelectItem value="resolution">Resolucion</SelectItem>
            <SelectItem value="standard">Norma</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titulo</TableHead>
                <TableHead>Numero</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Organismo</TableHead>
                <TableHead>Publicacion</TableHead>
                <TableHead className="w-[120px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : filtered?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <button className="hover:underline text-left" onClick={() => setSelected(item)}>{item.title}</button>
                      </TableCell>
                      <TableCell><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{item.regulation_number}</code></TableCell>
                      <TableCell>
                        <Badge variant={categoryVariants[item.category] as 'destructive' | 'default' | 'secondary' | 'outline'}>
                          {categoryLabels[item.category] || item.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.issuing_body}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(item.publication_date)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {can('regulations', 'edit') && (
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}><Pencil className="h-4 w-4" /></Button>
                          )}
                          {can('regulations', 'delete') && (
                            <Button variant="ghost" size="sm" onClick={() => { setRegToDelete(item); setDeleteDialogOpen(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
            <DialogTitle>{selected?.title}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge variant={categoryVariants[selected.category] as 'destructive' | 'default' | 'secondary' | 'outline'}>
                  {categoryLabels[selected.category] || selected.category}
                </Badge>
                <Badge variant="outline">{selected.regulation_number}</Badge>
              </div>
              {selected.summary && <p className="text-sm text-muted-foreground">{selected.summary}</p>}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Organismo:</span>
                  <p className="text-muted-foreground">{selected.issuing_body}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Publicacion:</span>
                  <span className="text-muted-foreground">{formatDate(selected.publication_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Vigencia:</span>
                  <span className="text-muted-foreground">{selected.effective_date ? formatDate(selected.effective_date) : 'N/A'}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingReg ? 'Editar Normativa' : 'Nueva Normativa'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium">Título *</label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Título de la normativa" />
            </div>
            <div>
              <label className="text-sm font-medium">Número *</label>
              <Input value={formData.regulation_number} onChange={(e) => setFormData({ ...formData, regulation_number: e.target.value })} placeholder="RES-2025-001" />
            </div>
            <div>
              <label className="text-sm font-medium">Categoría</label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="law">Ley</SelectItem>
                  <SelectItem value="decree">Decreto</SelectItem>
                  <SelectItem value="resolution">Resolución</SelectItem>
                  <SelectItem value="standard">Norma</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Organismo</label>
              <Input value={formData.issuing_body} onChange={(e) => setFormData({ ...formData, issuing_body: e.target.value })} placeholder="MINDUS" />
            </div>
            <div>
              <label className="text-sm font-medium">Fecha publicación</label>
              <Input type="date" value={formData.publication_date} onChange={(e) => setFormData({ ...formData, publication_date: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Fecha vigencia</label>
              <Input type="date" value={formData.effective_date} onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Resumen</label>
              <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={formData.summary} onChange={(e) => setFormData({ ...formData, summary: e.target.value })} placeholder="Resumen de la normativa" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!formData.title || !formData.regulation_number || createMutation.isPending || updateMutation.isPending}>
              {editingReg ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>¿Está seguro de eliminar &quot;{regToDelete?.title}&quot;? Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Pagina {page} de {data.total_pages} ({data.total} total)</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={page >= data.total_pages} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
          </div>
        </div>
      )}
    </div>
  );
}