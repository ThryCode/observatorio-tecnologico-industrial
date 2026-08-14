import { useState, useEffect } from 'react';
import { useProfessionalList, useSpecialties } from '@/hooks/useProfessionals';
import type { ProfessionalListItem } from '@/types';
import PageHeader from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, X, ExternalLink, BookOpen, Briefcase, GraduationCap, Mail, Phone as PhoneIcon } from 'lucide-react';

export default function Network() {
  const [page, setPage] = useState(1);
  const [specialty, setSpecialty] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selected, setSelected] = useState<ProfessionalListItem | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const { data: specialtiesData } = useSpecialties();
  const { data, isLoading } = useProfessionalList(page, 20, specialty || undefined, debouncedQuery || undefined);

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
            placeholder="Buscar por nombre, cargo o institución..."
            className="pl-9 pr-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
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
                    <TableRow
                      key={person.id}
                      onClick={() => setSelected(selected?.id === person.id ? null : person)}
                      className={`cursor-pointer transition-colors ${selected?.id === person.id ? 'bg-primary/5' : 'hover:bg-muted/50'}`}
                    >
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

        <div className="lg:col-span-1">
          {selected ? (
            <Card className="sticky top-6">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-white text-sm font-bold shadow-sm">
                      {getInitials(selected.full_name)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{selected.full_name}</CardTitle>
                      <p className="text-xs text-muted-foreground">@{selected.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Cerrar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  {selected.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{selected.email}</span>
                    </div>
                  )}
                  {selected.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <PhoneIcon className="h-3.5 w-3.5 shrink-0" />
                      <span>{selected.phone}</span>
                    </div>
                  )}
                  {selected.job_title && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Briefcase className="h-3.5 w-3.5 shrink-0" />
                      <span>{selected.job_title}</span>
                    </div>
                  )}
                </div>

                {selected.profile && (
                  <>
                    <div className="border-t border-border pt-3 space-y-2 text-sm">
                      {selected.profile.especialidad && (
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span className="font-medium">{selected.profile.especialidad}</span>
                        </div>
                      )}
                      {selected.profile.grado_cientifico && (
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span>{selected.profile.grado_cientifico}</span>
                        </div>
                      )}
                    </div>

                    {selected.profile.biografia && (
                      <div className="border-t border-border pt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Biografía</p>
                        <p className="text-sm text-foreground/80 leading-relaxed">{selected.profile.biografia}</p>
                      </div>
                    )}

                    {selected.profile.intereses && selected.profile.intereses.length > 0 && (
                      <div className="border-t border-border pt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Intereses</p>
                        <div className="flex flex-wrap gap-1.5">
                          {selected.profile.intereses.map((interes) => (
                            <Badge key={interes} variant="secondary" className="text-xs">{interes}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {(selected.profile.linkedin_url || selected.profile.twitter_url || selected.profile.researchgate_url || selected.profile.orcid) && (
                      <div className="border-t border-border pt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Enlaces</p>
                        <div className="space-y-1.5">
                          {selected.profile.linkedin_url && (
                            <a href={selected.profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-primary hover:underline">
                              <ExternalLink className="h-3 w-3" /> LinkedIn
                            </a>
                          )}
                          {selected.profile.twitter_url && (
                            <a href={selected.profile.twitter_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-primary hover:underline">
                              <ExternalLink className="h-3 w-3" /> Twitter / X
                            </a>
                          )}
                          {selected.profile.researchgate_url && (
                            <a href={selected.profile.researchgate_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-primary hover:underline">
                              <ExternalLink className="h-3 w-3" /> ResearchGate
                            </a>
                          )}
                          {selected.profile.orcid && (
                            <span className="flex items-center gap-2 text-xs text-muted-foreground">
                              <ExternalLink className="h-3 w-3" /> ORCID: {selected.profile.orcid}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {!selected.profile && (
                  <p className="text-xs text-muted-foreground italic">Este profesional aún no tiene perfil registrado.</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="sticky top-6">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Haz clic en un profesional para ver sus datos.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
