import { useState, useEffect } from 'react';
import { usePatents, useCreatePatent, useUpdatePatent, useDeletePatent } from '@/hooks/usePatents';
import FileUpload from '@/components/FileUpload';
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
import { Search, Calendar, User, FileText, Globe, Plus, Pencil, Trash2, AlertCircle, Download } from 'lucide-react';
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

  const { data, isLoading, isError } = usePatents(page, 20, sector || undefined, status || undefined, search || undefined);

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
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Patentes</h2>
          <p className="text-muted-foreground">Error al cargar los datos.</p>
        </div>
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Patentes</h2>
          <p className="text-muted-foreground">
            Registro de patentes nacionales e internacionales por sector tecnológico.
          </p>
        </div>
        {can('patents', 'create') && (
          <Button className="gap-2" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            Nueva Patente
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar patentes (título, número, solicitante)..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
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

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="mb-2 h-5 w-3/4" />
                <Skeleton className="mb-4 h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data?.items.map((patent) => (
            <Card key={patent.id} className="transition-colors hover:border-primary/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium leading-tight">
                    <button className="hover:underline text-left" onClick={() => setSelectedPatent(patent)}>
                      {patent.title}
                    </button>
                  </CardTitle>
                  <Badge className={getStatusColor(patent.status)}>
                    {statusLabels[patent.status] || capitalize(patent.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  <span>{patent.patent_number}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  <span>{patent.applicant}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(patent.filing_date)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-3.5 w-3.5" />
                  <span>{patent.country}</span>
                </div>
                <div className="flex gap-1 pt-2">
                  {patent.file_url && (
                    <a href={patent.file_url} download onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" type="button">
                        <Download className="h-4 w-4 text-blue-500" />
                      </Button>
                    </a>
                  )}
                  {can('patents', 'edit') && (
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEditDialog(patent); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {can('patents', 'delete') && (
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setPatentToDelete(patent); setDeleteDialogOpen(true); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {data?.items.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No hay patentes registradas aún.
            </div>
          )}
        </div>
      )}

      <Dialog open={!!selectedPatent && !dialogOpen && !deleteDialogOpen} onOpenChange={() => setSelectedPatent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPatent?.title}</DialogTitle>
            <DialogDescription>Número: {selectedPatent?.patent_number}</DialogDescription>
          </DialogHeader>
          {selectedPatent && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge className={getStatusColor(selectedPatent.status)}>
                  {statusLabels[selectedPatent.status] || capitalize(selectedPatent.status)}
                </Badge>
                <Badge variant="outline">{selectedPatent.country}</Badge>
                {selectedPatent.technological_sector && (
                  <Badge variant="secondary">{selectedPatent.technological_sector}</Badge>
                )}
              </div>
              {selectedPatent.abstract && (
                <div>
                  <h4 className="mb-1 text-sm font-medium">Resumen</h4>
                  <p className="text-sm text-muted-foreground">{selectedPatent.abstract}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Solicitante:</span>
                  <p className="text-muted-foreground">{selectedPatent.applicant}</p>
                </div>
                <div>
                  <span className="font-medium">Inventor(es):</span>
                  <p className="text-muted-foreground">{selectedPatent.inventor}</p>
                </div>
                <div>
                  <span className="font-medium">Fecha de solicitud:</span>
                  <p className="text-muted-foreground">{formatDate(selectedPatent.filing_date)}</p>
                </div>
                <div>
                  <span className="font-medium">Fecha de publicación:</span>
                  <p className="text-muted-foreground">{selectedPatent.publication_date ? formatDate(selectedPatent.publication_date) : '-'}</p>
                </div>
                <div>
                  <span className="font-medium">Sector tecnológico:</span>
                  <p className="text-muted-foreground">{selectedPatent.technological_sector || '-'}</p>
                </div>
                <div>
                  <span className="font-medium">País:</span>
                  <p className="text-muted-foreground">{selectedPatent.country}</p>
                </div>
              </div>
              {selectedPatent.file_url && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Archivo adjunto:</span>
                  <a href={selectedPatent.file_url} download className="flex items-center gap-1 text-primary hover:underline">
                    <Download className="h-3.5 w-3.5" />
                    Descargar archivo
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
            <div className="flex items-center gap-2 text-sm text-red-500">
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

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {page} de {data.total_pages} ({data.total} total)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={page >= data.total_pages} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
          </div>
        </div>
      )}
    </div>
  );
}