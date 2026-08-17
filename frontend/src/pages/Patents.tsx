import { useState, useEffect } from 'react';
import { usePatents, useCreatePatent, useUpdatePatent, useDeletePatent } from '@/hooks/usePatents';
import FileUpload from '@/components/FileUpload';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus, Pencil, Trash2, AlertCircle, Download, X } from 'lucide-react';
import { formatDate, getStatusColor, capitalize } from '@/utils/formatters';
import { usePermissions } from '@/hooks/usePermissions';
import type { Patent } from '@/types';

const sectorOptions = [
  { value: '', label: 'Todos los sectores' },
  { value: 'SID', label: 'Siderurgia' },
  { value: 'MET', label: 'Metalurgia' },
  { value: 'ELE', label: 'Electrónica' },
  { value: 'QUI', label: 'Química' },
  { value: 'AUT', label: 'Automación' },
];

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'filed', label: 'Solicitada' },
  { value: 'examination', label: 'En examen' },
  { value: 'granted', label: 'Concedida' },
  { value: 'expired', label: 'Expirada' },
  { value: 'rejected', label: 'Rechazada' },
];

const statusLabels: Record<string, string> = {
  filed: 'Solicitada',
  examination: 'En examen',
  granted: 'Concedida',
  expired: 'Expirada',
  rejected: 'Rechazada',
};

export default function Patents() {
  const { can } = usePermissions();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sector, setSector] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedPatent, setSelectedPatent] = useState<Patent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPatent, setEditingPatent] = useState<Patent | null>(null);
  const [patentToDelete, setPatentToDelete] = useState<Patent | null>(null);
  const [saveError, setSaveError] = useState('');
  const [formData, setFormData] = useState({
    title: '', patent_number: '', applicant: '', inventor: '', filing_date: '',
    publication_date: '', status: '', abstract: '', technological_sector: '', country: '',
    file_url: '',
  });

  const createMutation = useCreatePatent();
  const updateMutation = useUpdatePatent();
  const deleteMutation = useDeletePatent();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError } = usePatents(page, 20, sector || undefined, status || undefined, debouncedSearch || undefined);

  useEffect(() => {
    if (data?.total !== undefined) {
      localStorage.setItem('lastPatentSeenCount', String(data.total));
    }
  }, [data?.total]);

  const resetForm = () => {
    setFormData({ title: '', patent_number: '', applicant: '', inventor: '', filing_date: '', publication_date: '', status: '', abstract: '', technological_sector: '', country: '', file_url: '' });
    setEditingPatent(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (patent: Patent) => {
    setEditingPatent(patent);
    setFormData({
      title: patent.title, patent_number: patent.patent_number, applicant: patent.applicant,
      inventor: patent.inventor, filing_date: patent.filing_date, publication_date: patent.publication_date || '',
      status: patent.status, abstract: patent.abstract || '', technological_sector: patent.technological_sector || '',
      country: patent.country, file_url: patent.file_url || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaveError('');
    const data: Partial<Patent> & { file_url?: string } = {
      ...formData,
      status: formData.status as import('@/types').PatentStatus,
      publication_date: formData.publication_date || undefined,
      abstract: formData.abstract || undefined,
      technological_sector: formData.technological_sector || undefined,
      file_url: formData.file_url || undefined,
    };
    try {
      if (editingPatent) {
        await updateMutation.mutateAsync({ id: editingPatent.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      setDialogOpen(false);
      resetForm();
    } catch {
      setSaveError('Error al guardar la patente. Verifica los datos.');
    }
  };

  const handleDelete = async () => {
    if (!patentToDelete) return;
    await deleteMutation.mutateAsync(patentToDelete.id);
    setDeleteDialogOpen(false);
    setPatentToDelete(null);
    if (selectedPatent?.id === patentToDelete.id) setSelectedPatent(null);
  };

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Patentes" highlight="Patentes" description="Error al cargar los datos." />
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-8">
            <p className="text-sm text-destructive">No se pudieron cargar las patentes. Intente de nuevo mas tarde.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patentes"
        highlight="Patentes"
        description="Registro de patentes nacionales e internacionales por sector tecnológico."
        actions={
          can('patents', 'create') ? (
            <Button className="gap-2" onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              Nueva Patente
            </Button>
          ) : undefined
        }
      />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar patentes (título, número, solicitante)..."
            className="pl-9 pr-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={sector} onValueChange={(v) => { setSector(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Sector" /></SelectTrigger>
          <SelectContent>
            {sectorOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="bg-surface rounded-lg border border-border">
            <div className="grid gap-4 p-4 md:grid-cols-2">
              {isLoading ? Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}><CardContent className="p-4"><Skeleton className="mb-2 h-4 w-3/4" /><Skeleton className="mb-2 h-3 w-1/2" /><Skeleton className="h-3 w-full" /></CardContent></Card>
              )) : data?.items.map((patent) => (
                <Card
                  key={patent.id}
                  className={`cursor-pointer transition-colors ${selectedPatent?.id === patent.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                  onClick={() => setSelectedPatent(selectedPatent?.id === patent.id ? null : patent)}
                >
                  <CardHeader className="p-3 pb-1">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm font-medium leading-tight">{patent.title}</CardTitle>
                      <Badge className={`${getStatusColor(patent.status)} shrink-0 text-[10px]`}>
                        {statusLabels[patent.status] || capitalize(patent.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 space-y-1">
                    <p className="text-xs font-mono text-muted-foreground">{patent.patent_number}</p>
                    <p className="text-xs text-text-muted">{patent.country}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            {data?.items.length === 0 && !isLoading && (
              <div className="p-8 text-center text-muted-foreground">No hay patentes registradas aún.</div>
            )}
            {data && data.total_pages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <p className="text-sm text-muted-foreground">{data.total} registros en total</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1} className="rounded-md border border-border px-3 py-1 text-sm disabled:opacity-50">Anterior</button>
                  <span className="px-3 py-1 text-sm text-muted-foreground">Página {page} de {data.total_pages}</span>
                  <button onClick={() => setPage((p) => p + 1)} disabled={page >= data.total_pages} className="rounded-md border border-border px-3 py-1 text-sm disabled:opacity-50">Siguiente</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          {selectedPatent && !dialogOpen && !deleteDialogOpen ? (
            <Card className="sticky top-6">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-base font-semibold leading-tight">{selectedPatent.title}</p>
                    <p className="text-xs font-mono text-muted-foreground mt-1">{selectedPatent.patent_number}</p>
                  </div>
                  <Badge className={getStatusColor(selectedPatent.status)}>
                    {statusLabels[selectedPatent.status] || capitalize(selectedPatent.status)}
                  </Badge>
                </div>
                {selectedPatent.abstract && (
                  <div className="border-t border-border pt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Resumen</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{selectedPatent.abstract}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Solicitante</p>
                    <p className="text-sm">{selectedPatent.applicant}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Inventor(es)</p>
                    <p className="text-sm">{selectedPatent.inventor}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Fecha solicitud</p>
                    <p className="text-sm">{formatDate(selectedPatent.filing_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Fecha publicación</p>
                    <p className="text-sm">{selectedPatent.publication_date ? formatDate(selectedPatent.publication_date) : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Sector tecnológico</p>
                    <p className="text-sm">{selectedPatent.technological_sector || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">País</p>
                    <p className="text-sm">{selectedPatent.country}</p>
                  </div>
                </div>
                {selectedPatent.file_url && (
                  <div className="border-t border-border pt-3">
                    <a href={selectedPatent.file_url} download className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                      <Download className="h-3.5 w-3.5" /> Descargar archivo
                    </a>
                  </div>
                )}
                <div className="border-t border-border pt-3 flex gap-1">
                  {selectedPatent.file_url && (
                    <a href={selectedPatent.file_url} download onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" type="button"><Download className="h-4 w-4 text-info" /></Button>
                    </a>
                  )}
                  {can('patents', 'edit') && (
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEditDialog(selectedPatent); }}><Pencil className="h-4 w-4" /></Button>
                  )}
                  {can('patents', 'delete') && (
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setPatentToDelete(selectedPatent); setDeleteDialogOpen(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="sticky top-6">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Haz clic en una patente para ver sus datos.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPatent ? 'Editar Patente' : 'Nueva Patente'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label htmlFor="patent-titulo" className="text-sm font-medium">Título *</label>
              <Input id="patent-titulo" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Título de la patente" />
            </div>
            <div>
              <label htmlFor="patent-numero" className="text-sm font-medium">Número de patente *</label>
              <Input id="patent-numero" value={formData.patent_number} onChange={(e) => setFormData({ ...formData, patent_number: e.target.value })} placeholder="CU2024/0001" />
            </div>
            <div>
              <label className="text-sm font-medium">Estado</label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar estado" /></SelectTrigger>
                <SelectContent>
                  {statusOptions.filter((o) => o.value).map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="patent-solicitante" className="text-sm font-medium">Solicitante *</label>
              <Input id="patent-solicitante" value={formData.applicant} onChange={(e) => setFormData({ ...formData, applicant: e.target.value })} placeholder="Solicitante" />
            </div>
            <div>
              <label htmlFor="patent-inventor" className="text-sm font-medium">Inventor(es)</label>
              <Input id="patent-inventor" value={formData.inventor} onChange={(e) => setFormData({ ...formData, inventor: e.target.value })} placeholder="Inventor(es)" />
            </div>
            <div>
              <label htmlFor="patent-fecha_solicitud" className="text-sm font-medium">Fecha de solicitud</label>
              <Input id="patent-fecha_solicitud" type="date" value={formData.filing_date} onChange={(e) => setFormData({ ...formData, filing_date: e.target.value })} />
            </div>
            <div>
              <label htmlFor="patent-fecha_publicacion" className="text-sm font-medium">Fecha de publicación</label>
              <Input id="patent-fecha_publicacion" type="date" value={formData.publication_date} onChange={(e) => setFormData({ ...formData, publication_date: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Sector tecnológico</label>
              <Select value={formData.technological_sector} onValueChange={(v) => setFormData({ ...formData, technological_sector: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar sector" /></SelectTrigger>
                <SelectContent>
                  {sectorOptions.filter((o) => o.value).map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="patent-pais" className="text-sm font-medium">País</label>
              <Input id="patent-pais" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} placeholder="Cuba" />
            </div>
            <div className="col-span-2">
              <label htmlFor="patent-resumen" className="text-sm font-medium">Resumen</label>
              <textarea
                id="patent-resumen"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={formData.abstract}
                onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                placeholder="Resumen de la patente"
              />
            </div>
            <div className="col-span-2">
              <label htmlFor="patent-file_url" className="text-sm font-medium">Archivo adjunto</label>
              <FileUpload
                id="patent-file_url"
                onUpload={(url) => setFormData({ ...formData, file_url: url })}
                currentUrl={formData.file_url}
                accept=".pdf,.doc,.docx"
              />
            </div>
          </div>
          {saveError && (
            <div className="flex items-center gap-2 text-sm text-danger">
              <AlertCircle className="h-4 w-4" />
              <span>{saveError}</span>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!formData.title || !formData.patent_number || !formData.applicant || createMutation.isPending || updateMutation.isPending}>
              {editingPatent ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>¿Está seguro de eliminar la patente &quot;{patentToDelete?.title}&quot;? Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
