import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import CrudPage from '@/components/CrudPage';
import type { CrudColumn } from '@/components/CrudPage';
import { useTechnologies, useCreateTechnology, useUpdateTechnology, useDeleteTechnology } from '@/hooks/useTechnologies';
import { getIndustrialSectors } from '@/api/industrialSectors';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [sector, setSector] = useState('all');

  const { data: sectorsData } = useQuery({
    queryKey: ['industrial-sectors'],
    queryFn: () => getIndustrialSectors(1, 100),
  });

  const sectorMap = new Map(sectorsData?.items?.map((s) => [s.codigo, s.nombre]) ?? []);
  const queryResult = useTechnologies(page, 20, sector === 'all' ? undefined : sector, q || undefined);
  const createMutation = useCreateTechnology();
  const updateMutation = useUpdateTechnology();
  const deleteMutation = useDeleteTechnology();

  const columns: CrudColumn<Technology>[] = [
    { header: 'Nombre', render: (t) => <span className="font-medium">{t.nombre}</span> },
    { header: 'Descripción', className: 'max-w-xs truncate text-muted-foreground', render: (t) => t.descripcion || '-' },
    { header: 'TRL', render: (t) => t.trl_nivel ? <Badge variant="outline">TRL {t.trl_nivel}</Badge> : <span className="text-muted-foreground">-</span> },
    { header: 'Sector', render: (t) => sectorMap.get(t.sector_codigo ?? '') || t.sector_codigo || '-' },
    { header: 'Palabras Clave', render: (t) => (
      <div className="flex flex-wrap gap-1">
        {t.palabras_clave?.slice(0, 3).map((kw) => <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>)}
        {(t.palabras_clave?.length ?? 0) > 3 && <Badge variant="secondary" className="text-xs">+{t.palabras_clave!.length - 3}</Badge>}
      </div>
    )},
    { header: 'Creado', render: (t) => <span className="text-muted-foreground">{formatDate(t.created_at)}</span> },
  ];

  return (
    <CrudPage
      title="Tecnologías"
      description="Catálogo de tecnologías del ecosistema industrial."
      permissionResource="technologies"
      columns={columns}
      queryResult={queryResult}
      createMutation={createMutation}
      updateMutation={updateMutation}
      deleteMutation={deleteMutation}
      page={page}
      onPageChange={setPage}
      searchPlaceholder="Buscar tecnologías..."
      onSearch={setQ}
      filterBar={
        <Select value={sector} onValueChange={(v) => { setSector(v); setPage(1); }}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filtrar por sector" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los sectores</SelectItem>
            {sectorsData?.items?.map((s) => <SelectItem key={s.codigo} value={s.codigo}>{s.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
      }
      defaultForm={{ nombre: '', descripcion: '', sector_codigo: '', trl_nivel: '', palabras_clave: '' }}
      formToPayload={(form) => ({
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
        sector_codigo: form.sector_codigo || undefined,
        trl_nivel: form.trl_nivel ? Number(form.trl_nivel) : undefined,
        palabras_clave: form.palabras_clave ? form.palabras_clave.split(',').map((s: string) => s.trim()).filter(Boolean) : undefined,
      })}
      transformEditItem={(item) => ({
        ...item,
        palabras_clave: (item.palabras_clave ?? []).join(', '),
        trl_nivel: item.trl_nivel ? String(item.trl_nivel) : '',
      })}
      validateForm={(form) => !form.nombre ? 'El nombre es obligatorio' : null}
      renderForm={({ data, onChange }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nombre *</label>
            <Input value={data.nombre} onChange={(e) => onChange({ nombre: e.target.value })} placeholder="Nombre de la tecnología" />
          </div>
          <div>
            <label className="text-sm font-medium">Descripción</label>
            <Textarea value={data.descripcion} onChange={(e) => onChange({ descripcion: e.target.value })} placeholder="Descripción de la tecnología" />
          </div>
          <div>
            <label className="text-sm font-medium">Sector</label>
            <Select value={data.sector_codigo} onValueChange={(v) => onChange({ sector_codigo: v })}>
              <SelectTrigger><SelectValue placeholder="Seleccionar sector" /></SelectTrigger>
              <SelectContent>
                {sectorsData?.items?.map((s) => <SelectItem key={s.codigo} value={s.codigo}>{s.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Nivel TRL</label>
            <Select value={data.trl_nivel} onValueChange={(v) => onChange({ trl_nivel: v })}>
              <SelectTrigger><SelectValue placeholder="Seleccionar TRL" /></SelectTrigger>
              <SelectContent>
                {trlOptions.map((opt) => <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Palabras clave (separadas por coma)</label>
            <Input value={data.palabras_clave} onChange={(e) => onChange({ palabras_clave: e.target.value })} placeholder="ej: ia, manufactura, sensores" />
          </div>
        </div>
      )}
      renderDetail={(tech) => (
        <div className="space-y-4">
          {tech.descripcion && <p className="text-sm text-muted-foreground">{tech.descripcion}</p>}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-medium">Sector:</span><p className="text-muted-foreground">{sectorMap.get(tech.sector_codigo ?? '') || tech.sector_codigo || '-'}</p></div>
            <div><span className="font-medium">TRL Nivel:</span><p className="text-muted-foreground">{tech.trl_nivel ? `TRL ${tech.trl_nivel}` : '-'}</p></div>
          </div>
          {tech.palabras_clave && tech.palabras_clave.length > 0 && (
            <div><span className="text-sm font-medium">Palabras clave:</span><div className="flex flex-wrap gap-1 mt-1">{tech.palabras_clave.map((kw) => <Badge key={kw} variant="secondary">{kw}</Badge>)}</div></div>
          )}
          <div className="text-sm text-muted-foreground">Creado: {formatDate(tech.created_at)}</div>
        </div>
      )}
    />
  );
}
