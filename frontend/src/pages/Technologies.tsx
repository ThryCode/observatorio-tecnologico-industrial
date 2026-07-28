import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTechnologies, useCreateTechnology, useUpdateTechnology, useDeleteTechnology } from '@/hooks/useTechnologies';
import { getIndustrialSectors } from '@/api/industrialSectors';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { formatDate } from '@/utils/formatters';
import type { Technology } from '@/types';

const trlOptions = [
  { value: 1, label: 'TRL 1 - Principios básicos' },
  { value: 2, label: 'TRL 2 - Concepto tecnológico' },
  { value: 3, label: 'TRL 3 - Prueba de concepto' },
  { value: 4, label: 'TRL 4 - Validación laboratorio' },
  { value: 5, label: 'TRL 5 - Validación entorno' },
  { value: 6, label: 'TRL 6 - Demostración prototipo' },
  { value: 7, label: 'TRL 7 - Demostración completa' },
  { value: 8, label: 'TRL 8 - Sistema cualificado' },
  { value: 9, label: 'TRL 9 - Sistema probado' },
];

export default function Technologies() {
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedTech, setSelectedTech] = useState<Technology | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTech, setEditingTech] = useState<Technology | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    sector_codigo: '',
    trl_nivel: '',
    palabras_clave: '',
  });

  const createMutation = useCreateTechnology();
  const updateMutation = useUpdateTechnology();
  const deleteMutation = useDeleteTechnology();

  const { data: sectorsData } = useQuery({
    queryKey: ['industrial-sectors'],
    queryFn: () => getIndustrialSectors(1, 100),
  });

  const sectorMap = new Map(sectorsData?.items?.map((s) => [s.codigo, s.nombre]) ?? []);

  const { data, isLoading, isError, refetch } = useTechnologies(page, 20, sector === 'all' ? undefined : sector);

  const resetForm = () => {
    setFormData({ nombre: '', descripcion: '', sector_codigo: '', trl_nivel: '', palabras_clave: '' });
    setEditingTech(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (tech: Technology) => {
    setEditingTech(tech);
    setFormData({
      nombre: tech.nombre,
      descripcion: tech.descripcion || '',
      sector_codigo: tech.sector_codigo || '',
      trl_nivel: tech.trl_nivel ? String(tech.trl_nivel) : '',
      palabras_clave: tech.palabras_clave?.join(', ') || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const data: Partial<Technology> = {
      nombre: formData.nombre,
      descripcion: formData.descripcion || undefined,
      sector_codigo: formData.sector_codigo || undefined,
      trl_nivel: formData.trl_nivel ? Number(formData.trl_nivel) : undefined,
      palabras_clave: formData.palabras_clave ? formData.palabras_clave.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
    };
    if (editingTech) {
      await updateMutation.mutateAsync({ id: editingTech.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setDialogOpen(false);
    resetForm();
    refetch();
  };

  const handleDelete = async () => {
    if (!selectedTech) return;
    await deleteMutation.mutateAsync(selectedTech.id);
    setDeleteDialogOpen(false);
    setSelectedTech(null);
    refetch();
  };

  const filtered = (data?.items ?? []).filter(
    (tech) => !search || tech.nombre.toLowerCase().includes(search.toLowerCase()),
  );

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tecnologías</h2>
          <p className="text-muted-foreground">Error al cargar los datos.</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-8">
            <p className="text-sm text-destructive">No se pudieron cargar las tecnologías. Intente de nuevo mas tarde.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tecnologías</h2>
          <p className="text-muted-foreground">
            Catálogo de tecnologías del ecosistema industrial.
          </p>
        </div>
        <Button className="gap-2" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          Nueva Tecnología
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar tecnologías..."
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
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>TRL</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Palabras Clave</TableHead>
                <TableHead>Creado</TableHead>
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
                  ? filtered.map((tech) => (
                      <TableRow key={tech.id}>
                        <TableCell className="font-medium">
                          <button className="hover:underline text-left" onClick={() => setSelectedTech(tech)}>
                            {tech.nombre}
                          </button>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-muted-foreground">
                          {tech.descripcion || '-'}
                        </TableCell>
                        <TableCell>
                          {tech.trl_nivel ? (
                            <Badge variant="outline">TRL {tech.trl_nivel}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{sectorMap.get(tech.sector_codigo ?? '') || tech.sector_codigo || '-'}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {tech.palabras_clave?.slice(0, 3).map((kw) => (
                              <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>
                            ))}
                            {(tech.palabras_clave?.length ?? 0) > 3 && (
                              <Badge variant="secondary" className="text-xs">+{tech.palabras_clave!.length - 3}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(tech.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(tech)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedTech(tech); setDeleteDialogOpen(true); }}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedTech(tech)}>
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No hay tecnologías registradas aún.
                        </TableCell>
                      </TableRow>
                    )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedTech && !deleteDialogOpen && !dialogOpen} onOpenChange={() => setSelectedTech(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedTech?.nombre}</DialogTitle>
            <DialogDescription>Detalles de la tecnología</DialogDescription>
          </DialogHeader>
          {selectedTech && (
            <div className="space-y-4">
              {selectedTech.descripcion && (
                <p className="text-sm text-muted-foreground">{selectedTech.descripcion}</p>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Sector:</span>
                  <p className="text-muted-foreground">{sectorMap.get(selectedTech.sector_codigo ?? '') || selectedTech.sector_codigo || '-'}</p>
                </div>
                <div>
                  <span className="font-medium">TRL Nivel:</span>
                  <p className="text-muted-foreground">{selectedTech.trl_nivel ? `TRL ${selectedTech.trl_nivel}` : '-'}</p>
                </div>
              </div>
              {selectedTech.palabras_clave && selectedTech.palabras_clave.length > 0 && (
                <div>
                  <span className="text-sm font-medium">Palabras clave:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedTech.palabras_clave.map((kw) => (
                      <Badge key={kw} variant="secondary">{kw}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                Creado: {formatDate(selectedTech.created_at)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTech ? 'Editar Tecnología' : 'Nueva Tecnología'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre *</label>
              <Input value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Nombre de la tecnología" />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción de la tecnología"
              />
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
              <label className="text-sm font-medium">Nivel TRL</label>
              <Select value={formData.trl_nivel} onValueChange={(v) => setFormData({ ...formData, trl_nivel: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar TRL" />
                </SelectTrigger>
                <SelectContent>
                  {trlOptions.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Palabras clave (separadas por coma)</label>
              <Input value={formData.palabras_clave} onChange={(e) => setFormData({ ...formData, palabras_clave: e.target.value })} placeholder="ej: ia, manufactura, sensores" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!formData.nombre || createMutation.isPending || updateMutation.isPending}>
              {editingTech ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro de eliminar "{selectedTech?.nombre}"? Esta acción no se puede deshacer.
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