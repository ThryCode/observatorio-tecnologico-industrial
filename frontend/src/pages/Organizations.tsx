import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useOrganizations, useCreateOrganization, useDeleteOrganization } from '@/hooks/useOrganizations';
import { useAuth } from '@/contexts/AuthContext';
import { getIndustrialSectors } from '@/api/industrialSectors';
import { followOrganization, unfollowOrganization, getFollowStatus } from '@/api/follows';
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
import { Search, Building2, Globe, MapPin, ExternalLink, Phone, Calendar, Plus, Trash2 } from 'lucide-react';
import { formatDate } from '@/utils/formatters';
import { usePermissions } from '@/hooks/usePermissions';
import type { Organization } from '@/types';

const tipoOptions = [
  { value: 'centro_investigacion', label: 'Centro de Investigación' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'ministerio', label: 'Ministerio' },
  { value: 'universidad', label: 'Universidad' },
  { value: 'asociacion', label: 'Asociación' },
  { value: 'otro', label: 'Otro' },
];

export default function Organizations() {
  const { can } = usePermissions();
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('all');
  const [page, setPage] = useState(1);
  const { user: currentUser } = useAuth();
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [followStatus, setFollowStatus] = useState<{ is_following: boolean; followers_count: number } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null);
  const [formData, setFormData] = useState({
    nombre: '', siglas: '', tipo: '', sector_codigo: '', pais: '', provincia: '',
    sitio_web: '', email_contacto: '', fecha_creacion: '', contacto: '',
  });

  const createMutation = useCreateOrganization();
  const deleteMutation = useDeleteOrganization();

  useEffect(() => {
    if (selectedOrg) {
      setFollowStatus(null);
      getFollowStatus(selectedOrg.id)
        .then(setFollowStatus)
        .catch(() => setFollowStatus(null));
    }
  }, [selectedOrg]);

  const queryClient = useQueryClient();

  const handleFollow = async () => {
    if (!selectedOrg) return;
    if (followStatus?.is_following) {
      await unfollowOrganization(selectedOrg.id);
      setFollowStatus({ is_following: false, followers_count: (followStatus.followers_count || 1) - 1 });
    } else {
      await followOrganization(selectedOrg.id);
      setFollowStatus({ is_following: true, followers_count: (followStatus?.followers_count || 0) + 1 });
    }
    queryClient.invalidateQueries({ queryKey: ['org-follow-stats'] });
    queryClient.invalidateQueries({ queryKey: ['follow-status', selectedOrg.id] });
  };

  const { data: sectorsData } = useQuery({
    queryKey: ['industrial-sectors'],
    queryFn: () => getIndustrialSectors(1, 100),
  });

  const sectorMap = new Map(sectorsData?.items?.map((s) => [s.codigo, s.nombre]) ?? []);

  const { data, isLoading, isError } = useOrganizations(page, 100, sector === 'all' ? undefined : sector);

  const resetForm = () => {
    setFormData({ nombre: '', siglas: '', tipo: '', sector_codigo: '', pais: '', provincia: '', sitio_web: '', email_contacto: '', fecha_creacion: '', contacto: '' });
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const data: Partial<Organization> = { ...formData, sector_codigo: formData.sector_codigo || undefined };
    await createMutation.mutateAsync(data);
    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!orgToDelete) return;
    await deleteMutation.mutateAsync(orgToDelete.id);
    setDeleteDialogOpen(false);
    setOrgToDelete(null);
    if (selectedOrg?.id === orgToDelete.id) setSelectedOrg(null);
  };

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Organizaciones</h2>
          <p className="text-muted-foreground">Error al cargar los datos.</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-8">
            <p className="text-sm text-destructive">No se pudieron cargar las organizaciones. Intente de nuevo mas tarde.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filtered = (data?.items ?? []).filter(
    (org) =>
      !search ||
      org.nombre.toLowerCase().includes(search.toLowerCase()) ||
      org.siglas.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Organizaciones</h2>
          <p className="text-muted-foreground">
            Entidades de ciencia, tecnología e innovación del ecosistema industrial.
          </p>
        </div>
        {can('organizations', 'create') && (
          <Button className="gap-2" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            Nueva Organización
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar organizaciones..."
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
                <TableHead>Siglas</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Provincia</TableHead>
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
                : filtered && filtered.length > 0
                  ? filtered.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell className="font-medium">
                          <button className="hover:underline text-left" onClick={() => setSelectedOrg(org)}>
                            {org.nombre}
                          </button>
                        </TableCell>
                        <TableCell>{org.siglas}</TableCell>
                        <TableCell><Badge variant="secondary">{org.tipo}</Badge></TableCell>
                        <TableCell>{sectorMap.get(org.sector_codigo ?? '') || org.sector_codigo || '-'}</TableCell>
                        <TableCell>{org.provincia || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {can('organizations', 'delete') && (
                              <Button variant="ghost" size="sm" onClick={() => { setOrgToDelete(org); setDeleteDialogOpen(true); }}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => setSelectedOrg(org)}>
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No hay organizaciones registradas aún.
                        </TableCell>
                      </TableRow>
                    )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedOrg && !dialogOpen && !deleteDialogOpen} onOpenChange={() => setSelectedOrg(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedOrg?.nombre}</DialogTitle>
            <DialogDescription>{selectedOrg?.siglas}</DialogDescription>
          </DialogHeader>
          {selectedOrg && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Tipo:</span>
                <span className="text-muted-foreground">{selectedOrg.tipo}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Ubicación:</span>
                <span className="text-muted-foreground">
                  {[selectedOrg.provincia, selectedOrg.pais].filter(Boolean).join(', ') || '-'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Sitio web:</span>
                <span className="text-muted-foreground">{selectedOrg.sitio_web || '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Fecha de creación:</span>
                <span className="text-muted-foreground">{selectedOrg.fecha_creacion || '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Contacto:</span>
                <span className="text-muted-foreground">{selectedOrg.contacto || '-'}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Creado:</span>{' '}
                <span className="text-muted-foreground">{formatDate(selectedOrg.created_at)}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">{followStatus?.followers_count ?? 0} seguidores</p>
                {currentUser?.organization_id !== selectedOrg.id && (
                  <Button
                    variant={followStatus?.is_following ? 'secondary' : 'default'}
                    size="sm"
                    onClick={handleFollow}
                    disabled={!followStatus}
                  >
                    {followStatus?.is_following ? 'Siguiendo' : 'Seguir'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Organización</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium">Nombre *</label>
              <Input value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Nombre de la organización" />
            </div>
            <div>
              <label className="text-sm font-medium">Siglas *</label>
              <Input value={formData.siglas} onChange={(e) => setFormData({ ...formData, siglas: e.target.value })} placeholder="Siglas" />
            </div>
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                <SelectContent>
                  {tipoOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Sector</label>
              <Select value={formData.sector_codigo} onValueChange={(v) => setFormData({ ...formData, sector_codigo: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar sector" /></SelectTrigger>
                <SelectContent>
                  {sectorsData?.items?.map((s) => (
                    <SelectItem key={s.codigo} value={s.codigo}>{s.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">País</label>
              <Input value={formData.pais} onChange={(e) => setFormData({ ...formData, pais: e.target.value })} placeholder="País" />
            </div>
            <div>
              <label className="text-sm font-medium">Provincia</label>
              <Input value={formData.provincia} onChange={(e) => setFormData({ ...formData, provincia: e.target.value })} placeholder="Provincia" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Sitio web</label>
              <Input value={formData.sitio_web} onChange={(e) => setFormData({ ...formData, sitio_web: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <label className="text-sm font-medium">Email contacto</label>
              <Input value={formData.email_contacto} onChange={(e) => setFormData({ ...formData, email_contacto: e.target.value })} placeholder="email@ejemplo.cu" />
            </div>
            <div>
              <label className="text-sm font-medium">Contacto</label>
              <Input value={formData.contacto} onChange={(e) => setFormData({ ...formData, contacto: e.target.value })} placeholder="Nombre contacto" />
            </div>
            <div>
              <label className="text-sm font-medium">Fecha creación</label>
              <Input type="date" value={formData.fecha_creacion} onChange={(e) => setFormData({ ...formData, fecha_creacion: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!formData.nombre || !formData.siglas || createMutation.isPending}>
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>¿Está seguro de eliminar &quot;{orgToDelete?.nombre}&quot;? Esta acción no se puede deshacer.</DialogDescription>
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