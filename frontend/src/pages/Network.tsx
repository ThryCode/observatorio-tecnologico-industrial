import { useState } from 'react';
import { useProfessionalList, useSpecialties } from '@/hooks/useProfessionals';
import type { ProfessionalListItem } from '@/types';
import PageHeader from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, GraduationCap } from 'lucide-react';

export default function Network() {
  const [page, setPage] = useState(1);
  const [specialty, setSpecialty] = useState<string>('');

  const { data: specialtiesData } = useSpecialties();
  const { data, isLoading } = useProfessionalList(page, 20, specialty || undefined);

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Red Profesional CTI"
        highlight="Profesional"
        description="Directorio de profesionales, investigadores y gestores de ciencia, tecnología e innovación del ecosistema industrial."
      />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            className="pl-9"
            disabled
          />
        </div>
        <Select
          value={specialty}
          onValueChange={(v) => { setSpecialty(v === 'all' ? '' : v); setPage(1); }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todas las especialidades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las especialidades</SelectItem>
            {specialtiesData?.items?.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-lg" />
      ) : !data?.items?.length ? (
        <div className="bg-surface rounded-lg border border-border p-8 text-center text-muted-foreground">
          No se encontraron profesionales{specialty ? ' para esta especialidad' : ''}.
        </div>
      ) : (
        <div className="bg-surface rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Grado</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((person: ProfessionalListItem) => (
                <TableRow key={person.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-md bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                        {getInitials(person.full_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-foreground truncate">{person.full_name}</p>
                        <p className="text-xs text-text-muted">@{person.username}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[11px] text-text-muted">{person.profile?.especialidad || '—'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[11px] text-text-muted">{person.profile?.grado_cientifico || '—'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[11px] text-text-muted">{person.job_title || '—'}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="success" dot className="text-xs">
                      Activo
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {data.total_pages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-sm text-muted-foreground">
                {data.total} profesionales en total
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-md border border-border px-3 py-1 text-sm disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-sm text-muted-foreground">
                  Página {data.page} de {data.total_pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                  disabled={page === data.total_pages}
                  className="rounded-md border border-border px-3 py-1 text-sm disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
