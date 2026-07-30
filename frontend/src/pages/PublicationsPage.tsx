import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import CrudPage from '@/components/CrudPage';
import type { CrudColumn } from '@/components/CrudPage';
import { useResearchPublications, useCreateResearchPublication, useUpdateResearchPublication, useDeleteResearchPublication } from '@/hooks/useResearchPublications';
import { getIndustrialSectors } from '@/api/industrialSectors';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/utils/formatters';
import { FileText } from 'lucide-react';
import type { ResearchPublication } from '@/types';

export default function PublicationsPage() {
  const [page, setPage] = useState(1);
  const [sector, setSector] = useState('all');

  const { data: sectorsData } = useQuery({
    queryKey: ['industrial-sectors'],
    queryFn: () => getIndustrialSectors(1, 100),
  });

  const sectorMap = new Map(sectorsData?.items?.map((s) => [s.codigo, s.nombre]) ?? []);
  const queryResult = useResearchPublications(page, 20, sector === 'all' ? undefined : sector);
  const createMutation = useCreateResearchPublication();
  const updateMutation = useUpdateResearchPublication();
  const deleteMutation = useDeleteResearchPublication();

  const columns: CrudColumn<ResearchPublication>[] = [
    { header: 'Título', render: (p) => (
      <span className="font-medium flex items-center gap-2 whitespace-nowrap">
        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />{p.titulo}
      </span>
    )},
    { header: 'Autores', className: 'text-muted-foreground whitespace-nowrap', render: (p) => p.autores },
    { header: 'Journal', className: 'text-muted-foreground whitespace-nowrap', render: (p) => p.journal || '-' },
    { header: 'DOI', render: (p) => p.doi ? <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">{p.doi}</span> : <span className="text-muted-foreground">-</span> },
    { header: 'Sector', className: 'whitespace-nowrap', render: (p) => sectorMap.get(p.sector_codigo ?? '') || p.sector_codigo || '-' },
    { header: 'Publicado', className: 'text-muted-foreground whitespace-nowrap', render: (p) => formatDate(p.fecha_publicacion) },
  ];

  return (
    <CrudPage
      title="Publicaciones Científicas"
      description="Artículos de investigación, papers y reportes técnicos del ecosistema industrial."
      permissionResource="research-publications"
      columns={columns}
      queryResult={queryResult}
      createMutation={createMutation}
      updateMutation={updateMutation}
      deleteMutation={deleteMutation}
      page={page}
      onPageChange={setPage}
      searchPlaceholder="Buscar publicaciones..."
      searchFilter={(item, q) => item.titulo.toLowerCase().includes(q.toLowerCase()) || item.autores.toLowerCase().includes(q.toLowerCase())}
      filterBar={
        <Select value={sector} onValueChange={(v) => { setSector(v); setPage(1); }}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filtrar por sector" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los sectores</SelectItem>
            {sectorsData?.items?.map((s) => <SelectItem key={s.codigo} value={s.codigo}>{s.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
      }
      defaultForm={{ titulo: '', autores: '', resumen: '', doi: '', journal: '', fecha_publicacion: '', palabras_clave: '', sector_codigo: '', url: '' }}
      formToPayload={(form) => ({
        titulo: form.titulo,
        autores: form.autores,
        resumen: form.resumen || undefined,
        doi: form.doi || undefined,
        journal: form.journal || undefined,
        fecha_publicacion: form.fecha_publicacion ? new Date(form.fecha_publicacion).toISOString() : undefined,
        palabras_clave: form.palabras_clave ? form.palabras_clave.split(',').map((s: string) => s.trim()).filter(Boolean) : undefined,
        sector_codigo: form.sector_codigo || undefined,
        url: form.url || undefined,
      })}
      validateForm={(form) => !form.titulo ? 'El título es obligatorio' : !form.autores ? 'Los autores son obligatorios' : null}
      renderForm={({ data, onChange }) => (
        <div className="space-y-4">
          <div><label className="text-sm font-medium">Título *</label><Input value={data.titulo} onChange={(e) => onChange({ titulo: e.target.value })} placeholder="Título del artículo" /></div>
          <div><label className="text-sm font-medium">Autores *</label><Input value={data.autores} onChange={(e) => onChange({ autores: e.target.value })} placeholder="Apellido, N.; Apellido, M." /></div>
          <div><label className="text-sm font-medium">Resumen</label><textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={data.resumen} onChange={(e) => onChange({ resumen: e.target.value })} placeholder="Resumen del artículo" /></div>
          <div><label className="text-sm font-medium">DOI</label><Input value={data.doi} onChange={(e) => onChange({ doi: e.target.value })} placeholder="10.1234/ejemplo.2026.001" /></div>
          <div><label className="text-sm font-medium">Journal / Revista</label><Input value={data.journal} onChange={(e) => onChange({ journal: e.target.value })} placeholder="Nombre de la revista" /></div>
          <div><label className="text-sm font-medium">Fecha de publicación</label><Input type="date" value={data.fecha_publicacion} onChange={(e) => onChange({ fecha_publicacion: e.target.value })} /></div>
          <div>
            <label className="text-sm font-medium">Sector</label>
            <Select value={data.sector_codigo} onValueChange={(v) => onChange({ sector_codigo: v })}>
              <SelectTrigger><SelectValue placeholder="Seleccionar sector" /></SelectTrigger>
              <SelectContent>
                {sectorsData?.items?.map((s) => <SelectItem key={s.codigo} value={s.codigo}>{s.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><label className="text-sm font-medium">Palabras clave (separadas por coma)</label><Input value={data.palabras_clave} onChange={(e) => onChange({ palabras_clave: e.target.value })} placeholder="ej: ia, manufactura, energía" /></div>
          <div><label className="text-sm font-medium">URL</label><Input value={data.url} onChange={(e) => onChange({ url: e.target.value })} placeholder="https://..." /></div>
        </div>
      )}
      renderDetail={(pub) => (
        <div className="space-y-4">
          <div><span className="text-sm font-medium">Autores:</span><p className="text-sm text-muted-foreground">{pub.autores}</p></div>
          {pub.resumen && <div><span className="text-sm font-medium">Resumen:</span><p className="text-sm text-muted-foreground">{pub.resumen}</p></div>}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-medium">Journal:</span><p className="text-muted-foreground">{pub.journal || '-'}</p></div>
            <div><span className="font-medium">DOI:</span><p className="text-muted-foreground">{pub.doi || '-'}</p></div>
            <div><span className="font-medium">Sector:</span><p className="text-muted-foreground">{sectorMap.get(pub.sector_codigo ?? '') || pub.sector_codigo || '-'}</p></div>
            <div><span className="font-medium">Publicado:</span><p className="text-muted-foreground">{formatDate(pub.fecha_publicacion)}</p></div>
          </div>
          {pub.palabras_clave && pub.palabras_clave.length > 0 && (
            <div><span className="text-sm font-medium">Palabras clave:</span><div className="flex flex-wrap gap-1 mt-1">{pub.palabras_clave.map((kw) => <Badge key={kw} variant="secondary">{kw}</Badge>)}</div></div>
          )}
          {pub.url && <div className="text-sm"><a href={pub.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{pub.url}</a></div>}
        </div>
      )}
    />
  );
}
