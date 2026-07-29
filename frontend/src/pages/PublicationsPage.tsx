import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useResearchPublications, useCreateResearchPublication, useUpdateResearchPublication, useDeleteResearchPublication } from '@/hooks/useResearchPublications';
import { getIndustrialSectors } from '@/api/industrialSectors';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Plus, Pencil, Trash2, ExternalLink, FileText } from 'lucide-react';
import { formatDate } from '@/utils/formatters';
import { usePermissions } from '@/hooks/usePermissions';
import type { ResearchPublication } from '@/types';

export default function PublicationsPage() {
  const { can } = usePermissions();
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedPub, setSelectedPub] = useState<ResearchPublication | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPub, setEditingPub] = useState<ResearchPublication | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    autores: '',
    resumen: '',
    doi: '',
    journal: '',
    fecha_publicacion: '',
    palabras_clave: '',
    sector_codigo: '',
    url: '',
  });

  const createMutation = useCreateResearchPublication();
  const updateMutation = useUpdateResearchPublication();
  const deleteMutation = useDeleteResearchPublication();

  const { data: sectorsData } = useQuery({
    queryKey: ['industrial-sectors'],
    queryFn: () => getIndustrialSectors(1, 100),
  });

  const sectorMap = new Map(sectorsData?.items?.map((s) => [s.codigo, s.nombre]) ?? []);

  const { data, isLoading, isError, refetch } = useResearchPublications(
    page, 20, sector === 'all' ? undefined : sector,
  );

  const resetForm = () => {
    setFormData({
      titulo: '', autores: '', resumen: '', doi: '', journal: '',
      fecha_publicacion: '', palabras_clave: '', sector_codigo: '', url: '',
    });
    setEditingPub(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (pub: ResearchPublication) => {
    setEditingPub(pub);
    setFormData({
      titulo: pub.titulo,
      autores: pub.autores,
      resumen: pub.resumen || '',
      doi: pub.doi || '',
      journal: pub.journal || '',
      fecha_publicacion: pub.fecha_publicacion?.split('T')[0] || '',
      palabras_clave: pub.palabras_clave?.join(', ') || '',
      sector_codigo: pub.sector_codigo || '',
      url: pub.url || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const data: Partial<ResearchPublication> = {
      titulo: formData.titulo,
      autores: formData.autores,
      resumen: formData.resumen || undefined,
      doi: formData.doi || undefined,
      journal: formData.journal || undefined,
      fecha_publicacion: formData.fecha_publicacion ? new Date(formData.fecha_publicacion).toISOString() : undefined,
      palabras_clave: formData.palabras_clave ? formData.palabras_clave.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      sector_codigo: formData.sector_codigo || undefined,
      url: formData.url || undefined,
    };
    if (editingPub) {
      await updateMutation.mutateAsync({ id: editingPub.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setDialogOpen(false);
    resetForm();
    refetch();
  };

  const handleDelete = async () => {
    if (!selectedPub) return;
    await deleteMutation.mutateAsync(selectedPub.id);
    setDeleteDialogOpen(false);
    setSelectedPub(null);
    refetch();
  };

  const filtered = (data?.items ?? []).filter(
    (pub) => !search || pub.titulo.toLowerCase().includes(search.toLowerCase()) || pub.autores.toLowerCase().includes(search.toLowerCase()),
  );

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Publicaciones Científicas</h2>
          <p className="text-muted-foreground">Error al cargar los datos.</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-8">
            <p className="text-sm text-destructive">No se pudieron cargar las publicaciones. Intente de nuevo mas tarde.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Publicaciones Científicas</h2>
          <p className="text-muted-foreground">
            Artículos de investigación, papers y reportes técnicos del ecosistema industrial.
          </p>
        </div>
        {can('research-publications', 'create') && (
          <Button className="gap-2" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            Nueva Publicación
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar publicaciones..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={sector} onValueChange={(v) => { setSector(v); setPage(1); }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por sector" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los sectores</SelectItem>
            {sectorsData?.items?.map((s) => (
              <SelectItem key={s.codigo} value={s.codigo}>{s.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Autores</TableHead>
                <TableHead>Journal / Revista</TableHead>
                <TableHead>DOI</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Publicado</TableHead>
                <TableHead className="w-[100px]"></TableHead>
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
                : filtered && filtered.length > 0
                  ? filtered.map((pub) => (
                      <TableRow key={pub.id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          <button className="hover:underline text-left flex items-center gap-2" onClick={() => setSelectedPub(pub)}>
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>{pub.titulo}</span>
                          </button>
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {pub.autores}
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {pub.journal || '-'}
                        </TableCell>
                        <TableCell>
                          {pub.doi ? (
                            <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">{pub.doi}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{sectorMap.get(pub.sector_codigo ?? '') || pub.sector_codigo || '-'}</TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(pub.fecha_publicacion)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {can('research-publications', 'edit') && (
                              <Button variant="ghost" size="sm" onClick={() => openEditDialog(pub)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {can('research-publications', 'delete') && (
                              <Button variant="ghost" size="sm" onClick={() => { setSelectedPub(pub); setDeleteDialogOpen(true); }}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => setSelectedPub(pub)}>
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No hay publicaciones registradas aún.
                        </TableCell>
                      </TableRow>
                    )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedPub && !deleteDialogOpen && !dialogOpen} onOpenChange={() => setSelectedPub(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedPub?.titulo}</DialogTitle>
            <DialogDescription>Detalles de la publicación</DialogDescription>
          </DialogHeader>
          {selectedPub && (
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium">Autores:</span>
                <p className="text-sm text-muted-foreground">{selectedPub.autores}</p>
              </div>
              {selectedPub.resumen && (
                <div>
                  <span className="text-sm font-medium">Resumen:</span>
                  <p className="text-sm text-muted-foreground">{selectedPub.resumen}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Journal:</span>
                  <p className="text-muted-foreground">{selectedPub.journal || '-'}</p>
                </div>
                <div>
                  <span className="font-medium">DOI:</span>
                  <p className="text-muted-foreground">{selectedPub.doi || '-'}</p>
                </div>
                <div>
                  <span className="font-medium">Sector:</span>
                  <p className="text-muted-foreground">{sectorMap.get(selectedPub.sector_codigo ?? '') || selectedPub.sector_codigo || '-'}</p>
                </div>
                <div>
                  <span className="font-medium">Publicado:</span>
                  <p className="text-muted-foreground">{formatDate(selectedPub.fecha_publicacion)}</p>
                </div>
              </div>
              {selectedPub.palabras_clave && selectedPub.palabras_clave.length > 0 && (
                <div>
                  <span className="text-sm font-medium">Palabras clave:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedPub.palabras_clave.map((kw) => (
                      <Badge key={kw} variant="secondary">{kw}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {selectedPub.url && (
                <div className="text-sm">
                  <a href={selectedPub.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {selectedPub.url}
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
            <DialogTitle>{editingPub ? 'Editar Publicación' : 'Nueva Publicación'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título *</label>
              <Input value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} placeholder="Título del artículo" />
            </div>
            <div>
              <label className="text-sm font-medium">Autores *</label>
              <Input value={formData.autores} onChange={(e) => setFormData({ ...formData, autores: e.target.value })} placeholder="Apellido, N.; Apellido, M." />
            </div>
            <div>
              <label className="text-sm font-medium">Resumen</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={formData.resumen}
                onChange={(e) => setFormData({ ...formData, resumen: e.target.value })}
                placeholder="Resumen del artículo"
              />
            </div>
            <div>
              <label className="text-sm font-medium">DOI</label>
              <Input value={formData.doi} onChange={(e) => setFormData({ ...formData, doi: e.target.value })} placeholder="10.1234/ejemplo.2026.001" />
            </div>
            <div>
              <label className="text-sm font-medium">Journal / Revista</label>
              <Input value={formData.journal} onChange={(e) => setFormData({ ...formData, journal: e.target.value })} placeholder="Nombre de la revista" />
            </div>
            <div>
              <label className="text-sm font-medium">Fecha de publicación</label>
              <Input type="date" value={formData.fecha_publicacion} onChange={(e) => setFormData({ ...formData, fecha_publicacion: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Sector</label>
              <Select value={formData.sector_codigo} onValueChange={(v) => setFormData({ ...formData, sector_codigo: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sector" />
                </SelectTrigger>
                <SelectContent>
                  {sectorsData?.items?.map((s) => (
                    <SelectItem key={s.codigo} value={s.codigo}>{s.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Palabras clave (separadas por coma)</label>
              <Input value={formData.palabras_clave} onChange={(e) => setFormData({ ...formData, palabras_clave: e.target.value })} placeholder="ej: ia, manufactura, energía" />
            </div>
            <div>
              <label className="text-sm font-medium">URL</label>
              <Input value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!formData.titulo || !formData.autores || createMutation.isPending || updateMutation.isPending}>
              {editingPub ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro de eliminar &quot;{selectedPub?.titulo}&quot;? Esta acción no se puede deshacer.
            </DialogDescription>
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
            Mostrando página {page} de {data.total_pages} ({data.total} total)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" disabled={page >= data.total_pages} onClick={() => setPage((p) => p + 1)}>
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
