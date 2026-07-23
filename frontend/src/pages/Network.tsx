import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listProfessionals, listSpecialties } from '@/api/auth';
import type { ProfessionalListItem } from '@/types';
import PageHeader from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, GraduationCap } from 'lucide-react';

export default function Network() {
  const [page, setPage] = useState(1);
  const [specialty, setSpecialty] = useState<string>('');

  const { data: specialtiesData } = useQuery({
    queryKey: ['specialties'],
    queryFn: listSpecialties,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['professionals', page, specialty],
    queryFn: () => listProfessionals(page, 20, specialty || undefined),
  });

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
        <div className="bg-surface rounded-lg border border-border p-8 text-center text-muted-foreground">
          Cargando profesionales...
        </div>
      ) : !data?.items?.length ? (
        <div className="bg-surface rounded-lg border border-border p-8 text-center text-muted-foreground">
          No se encontraron profesionales{specialty ? ' para esta especialidad' : ''}.
        </div>
      ) : (
        <div className="bg-surface rounded-lg border border-border">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-base">
              <thead>
                <tr className="bg-background">
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-muted border-b border-border text-left rounded-tl-md">Nombre</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-muted border-b border-border text-left">Especialidad</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-muted border-b border-border text-left">Grado</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-muted border-b border-border text-left">Cargo</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-muted border-b border-border text-left rounded-tr-md">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((person: ProfessionalListItem, i: number) => {
                  const isLast = i === data.items.length - 1;
                  return (
                    <tr
                      key={person.id}
                      className={`transition-colors duration-150 hover:bg-accent-orange/[0.02] ${!isLast ? 'border-b border-border-subtle' : ''}`}
                    >
                      <td className={`px-4 py-4 ${isLast ? 'rounded-bl-md' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-md bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                            {getInitials(person.full_name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-base font-semibold text-foreground truncate">{person.full_name}</p>
                            <p className="text-xs text-text-muted">@{person.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[11px] text-text-muted">{person.profile?.especialidad || '—'}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[11px] text-text-muted">{person.profile?.grado_cientifico || '—'}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[11px] text-text-muted">{person.job_title || '—'}</span>
                      </td>
                      <td className={`px-4 py-4 ${isLast ? 'rounded-br-md' : ''}`}>
                        <Badge variant="success" dot className="text-xs">
                          Activo
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

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
