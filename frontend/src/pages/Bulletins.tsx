import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import CrudPage from '@/components/CrudPage';
import type { CrudColumn } from '@/components/CrudPage';
import { useBulletins, useCreateBulletin, useUpdateBulletin, useDeleteBulletin } from '@/hooks/useBulletins';
import { getIndustrialSectors } from '@/api/industrialSectors';
import { queryKeys } from '@/lib/queryKeys';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/utils/formatters';
import type { BulletinListItem } from '@/api/bulletins';
import { useLanguage } from '@/contexts/LanguageContext';

const categoryVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  alerta: 'destructive',
  boletin: 'default',
  estudio: 'secondary',
  mapa: 'outline',
};

export default function Bulletins() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [categoria, setCategoria] = useState('all');
  const { t } = useLanguage();

  const { data: sectorsData } = useQuery({
    queryKey: queryKeys.industrialSectors.list(1, 100),
    queryFn: () => getIndustrialSectors(1, 100),
  });

  const queryResult = useBulletins(page, 20, undefined, categoria === 'all' ? undefined : categoria, q || undefined);
  const createMutation = useCreateBulletin();
  const updateMutation = useUpdateBulletin();
  const deleteMutation = useDeleteBulletin();

  const columns: CrudColumn<BulletinListItem>[] = [
    { header: t('page.bulletins.titulo'), render: (b) => <span className="font-medium">{b.titulo}</span> },
    { header: t('page.bulletins.categoria'), render: (b) => <Badge variant={categoryVariant[b.categoria] || 'outline'}>{b.categoria}</Badge> },
    { header: t('page.bulletins.autor'), render: (b) => b.autor || <span className="text-muted-foreground">-</span> },
    { header: t('page.bulletins.fecha'), render: (b) => <span className="text-xs text-muted-foreground">{formatDate(b.fecha)}</span> },
  ];

  return (
    <CrudPage
      title={t('page.bulletins.title')}
      description={t('page.bulletins.description')}
      permissionResource="bulletins"
      columns={columns}
      queryResult={queryResult}
      createMutation={createMutation}
      updateMutation={updateMutation}
      deleteMutation={deleteMutation}
      page={page}
      onPageChange={setPage}
      searchPlaceholder="Buscar boletines..."
      onSearch={setQ}
      filterBar={
        <Select value={categoria} onValueChange={(v) => { setCategoria(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder={t('page.bulletins.categoria')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="boletin">Boletín</SelectItem>
            <SelectItem value="estudio">Estudio</SelectItem>
            <SelectItem value="alerta">Alerta Tecnológica</SelectItem>
            <SelectItem value="mapa">Mapa</SelectItem>
          </SelectContent>
        </Select>
      }
      defaultForm={{ titulo: '', resumen: '', categoria: 'boletin', autor: '', sector_codigo: '', fecha_publicacion: new Date().toISOString().slice(0, 10) }}
      formToPayload={(form) => ({
        titulo: form.titulo,
        resumen: form.resumen || undefined,
        categoria: form.categoria,
        autor: form.autor || undefined,
        sector_codigo: form.sector_codigo || undefined,
        fecha_publicacion: form.fecha_publicacion,
      })}
      transformEditItem={(item) => ({
        ...item,
        fecha_publicacion: item.fecha?.slice(0, 10) ?? '',
      })}
      validateForm={(form) => !form.titulo ? t('page.bulletins.titulo') + ' es obligatorio' : null}
      renderForm={({ data, onChange }) => (
        <div className="space-y-4">
          <div>
            <label htmlFor="bulletin-titulo" className="text-sm font-medium">{t('page.bulletins.titulo')} *</label>
            <Input id="bulletin-titulo" value={data.titulo} onChange={(e) => onChange({ titulo: e.target.value })} placeholder="Título del boletín" />
          </div>
          <div>
            <label htmlFor="bulletin-resumen" className="text-sm font-medium">{t('page.bulletins.resumen')}</label>
            <Textarea id="bulletin-resumen" value={data.resumen} onChange={(e) => onChange({ resumen: e.target.value })} placeholder="Resumen del contenido" />
          </div>
          <div>
            <label className="text-sm font-medium">{t('page.bulletins.categoria')}</label>
            <Select value={data.categoria} onValueChange={(v) => onChange({ categoria: v })}>
              <SelectTrigger><SelectValue placeholder={t('page.bulletins.categoria')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="boletin">Boletín</SelectItem>
                <SelectItem value="estudio">Estudio</SelectItem>
                <SelectItem value="alerta">Alerta Tecnológica</SelectItem>
                <SelectItem value="mapa">Mapa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="bulletin-autor" className="text-sm font-medium">{t('page.bulletins.autor')}</label>
            <Input id="bulletin-autor" value={data.autor} onChange={(e) => onChange({ autor: e.target.value })} placeholder="Autor o institución" />
          </div>
          <div>
            <label className="text-sm font-medium">{t('page.bulletins.sector')}</label>
            <Select value={data.sector_codigo} onValueChange={(v) => onChange({ sector_codigo: v })}>
              <SelectTrigger><SelectValue placeholder={t('page.patents.seleccionarSector')} /></SelectTrigger>
              <SelectContent>
                {sectorsData?.items?.map((s) => <SelectItem key={s.codigo} value={s.codigo}>{s.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="bulletin-fecha" className="text-sm font-medium">{t('page.bulletins.fechaPublicacion')} *</label>
            <Input id="bulletin-fecha" type="date" value={data.fecha_publicacion} onChange={(e) => onChange({ fecha_publicacion: e.target.value })} />
          </div>
        </div>
      )}
      renderSidebar={(bulletin) => (
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-base font-semibold">{bulletin.titulo}</p>
              <p className="text-xs text-muted-foreground">{bulletin.autor || 'Anónimo'}</p>
            </div>
            <Badge variant={categoryVariant[bulletin.categoria] || 'outline'}>{bulletin.categoria}</Badge>
          </div>
          {bulletin.resumen && (
            <div className="border-t border-border pt-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">{t('page.bulletins.resumen')}</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{bulletin.resumen}</p>
            </div>
          )}
          <div className="border-t border-border pt-3 text-xs text-muted-foreground">
            {t('page.bulletins.fecha')}: {formatDate(bulletin.fecha)}
          </div>
          {bulletin.url && (
            <div className="border-t border-border pt-3">
              <a href={bulletin.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                Descargar →
              </a>
            </div>
          )}
        </div>
      )}
    />
  );
}
