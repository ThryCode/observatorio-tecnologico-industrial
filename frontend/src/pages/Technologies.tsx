import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import CrudPage from '@/components/CrudPage';
import type { CrudColumn } from '@/components/CrudPage';
import { useTechnologies, useCreateTechnology, useUpdateTechnology, useDeleteTechnology } from '@/hooks/useTechnologies';
import { getIndustrialSectors } from '@/api/industrialSectors';
import { queryKeys } from '@/lib/queryKeys';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/utils/formatters';
import type { Technology } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();

  const { data: sectorsData } = useQuery({
    queryKey: queryKeys.industrialSectors.list(1, 100),
    queryFn: () => getIndustrialSectors(1, 100),
  });

  const sectorMap = new Map(sectorsData?.items?.map((s) => [s.codigo, s.nombre]) ?? []);
  const queryResult = useTechnologies(page, 20, sector === 'all' ? undefined : sector, q || undefined);
  const createMutation = useCreateTechnology();
  const updateMutation = useUpdateTechnology();
  const deleteMutation = useDeleteTechnology();

  const columns: CrudColumn<Technology>[] = [
    { header: 'Nombre', render: (t) => <span className="font-medium">{t.nombre}</span> },
    { header: 'TRL', render: (t) => t.trl_nivel ? <Badge variant="outline">TRL {t.trl_nivel}</Badge> : <span className="text-muted-foreground">-</span> },
    { header: 'Sector', render: (t) => <span className="text-[11px] text-text-muted">{sectorMap.get(t.sector_codigo ?? '') || t.sector_codigo || '-'}</span> },
  ];

  return (
    <CrudPage
      title={t('page.technologies.title')}
      description={t('page.technologies.description')}
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
          <SelectTrigger className="w-[200px]"><SelectValue placeholder={t('common.filtrarPorSector')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.todosLosSectores')}</SelectItem>
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
            <label htmlFor="technology-nombre" className="text-sm font-medium">{t('page.organizations.nombre')}</label>
            <Input id="technology-nombre" value={data.nombre} onChange={(e) => onChange({ nombre: e.target.value })} placeholder="Nombre de la tecnología" />
          </div>
          <div>
            <label htmlFor="technology-descripcion" className="text-sm font-medium">{t('page.publications.resumen')}</label>
            <Textarea id="technology-descripcion" value={data.descripcion} onChange={(e) => onChange({ descripcion: e.target.value })} placeholder="Descripción de la tecnología" />
          </div>
          <div>
            <label className="text-sm font-medium">Sector</label>
            <Select value={data.sector_codigo} onValueChange={(v) => onChange({ sector_codigo: v })}>
              <SelectTrigger><SelectValue placeholder={t('page.patents.seleccionarSector')} /></SelectTrigger>
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
            <label htmlFor="technology-palabras_clave" className="text-sm font-medium">{t('page.publications.palabrasClave')}</label>
            <Input id="technology-palabras_clave" value={data.palabras_clave} onChange={(e) => onChange({ palabras_clave: e.target.value })} placeholder="ej: ia, manufactura, sensores" />
          </div>
        </div>
      )}
      renderSidebar={(tech) => (
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-base font-semibold">{tech.nombre}</p>
              <p className="text-xs text-muted-foreground">{sectorMap.get(tech.sector_codigo ?? '') || '-'}</p>
            </div>
            {tech.trl_nivel && <Badge variant="outline">TRL {tech.trl_nivel}</Badge>}
          </div>
          {tech.descripcion && (
            <div className="border-t border-border pt-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">{t('page.publications.resumen')}</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{tech.descripcion}</p>
            </div>
          )}
          {tech.palabras_clave && tech.palabras_clave.length > 0 && (
            <div className="border-t border-border pt-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">{t('page.publications.palabrasClave')}</p>
              <div className="flex flex-wrap gap-1.5">
                {tech.palabras_clave.map((kw) => <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>)}
              </div>
            </div>
          )}
          <div className="border-t border-border pt-3 text-xs text-muted-foreground">
            {t('common.creado') + ':'} {formatDate(tech.created_at)}
          </div>
        </div>
      )}
    />
  );
}
