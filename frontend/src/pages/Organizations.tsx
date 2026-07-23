import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOrganizations } from '@/hooks/useOrganizations';
import { getOrganizationRepresentative } from '@/api/organizations';
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
import { Search, Building2, Globe, MapPin, ExternalLink, User as UserIcon, Mail, Phone, Briefcase } from 'lucide-react';
import { formatDate } from '@/utils/formatters';
import type { Organization, User } from '@/types';

export default function Organizations() {
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [representative, setRepresentative] = useState<User | null>(null);
  const [repLoading, setRepLoading] = useState(false);

  useEffect(() => {
    if (selectedOrg) {
      setRepLoading(true);
      setRepresentative(null);
      getOrganizationRepresentative(selectedOrg.id)
        .then(setRepresentative)
        .catch(() => setRepresentative(null))
        .finally(() => setRepLoading(false));
    } else {
      setRepresentative(null);
    }
  }, [selectedOrg]);

  const { data: sectorsData } = useQuery({
    queryKey: ['industrial-sectors'],
    queryFn: () => getIndustrialSectors(1, 100),
  });

  const sectorMap = new Map(sectorsData?.items?.map((s) => [s.codigo, s.nombre]) ?? []);

  const { data, isLoading, isError } = useOrganizations(page, 100, sector === 'all' ? undefined : sector);

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
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Organizaciones</h2>
        <p className="text-muted-foreground">
          Entidades de ciencia, tecnología e innovación del ecosistema industrial.
        </p>
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
              <SelectItem key={s.codigo} value={s.codigo}>
                {s.nombre}
              </SelectItem>
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
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : filtered && filtered.length > 0
                  ? filtered.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell className="font-medium">{org.nombre}</TableCell>
                        <TableCell>{org.siglas}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{org.tipo}</Badge>
                        </TableCell>
                        <TableCell>{sectorMap.get(org.sector_codigo ?? '') || org.sector_codigo || '-'}</TableCell>
                        <TableCell>{org.provincia || '-'}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedOrg(org)}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
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

      <Dialog open={!!selectedOrg} onOpenChange={() => setSelectedOrg(null)}>
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
                <span className="text-muted-foreground">
                  {selectedOrg.sitio_web || '-'}
                </span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Creado:</span>{' '}
                <span className="text-muted-foreground">{formatDate(selectedOrg.created_at)}</span>
              </div>

              <hr className="border-border" />
              <p className="text-sm font-medium">Representante</p>
              {repLoading ? (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              ) : representative ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{representative.full_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{representative.email}</span>
                  </div>
                  {representative.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{representative.phone}</span>
                    </div>
                  )}
                  {representative.job_title && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{representative.job_title}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin representante asignado</p>
              )}
            </div>
          )}
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
