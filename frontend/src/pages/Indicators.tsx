import { useState } from 'react';
import CrudPage from '@/components/CrudPage';
import type { CrudColumn } from '@/components/CrudPage';
import { useIndicators, useCreateIndicator, useUpdateIndicator, useDeleteIndicator } from '@/hooks/useIndicators';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate, formatNumber } from '@/utils/formatters';
import type { Indicator } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Indicators() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [period, setPeriod] = useState('');
  const { t } = useLanguage();

  const periodLabels: Record<string, string> = {
    monthly: t('page.indicators.mensual'), quarterly: t('page.indicators.trimestral'), yearly: t('page.indicators.anual'),
  };

  const queryResult = useIndicators(page, 20, undefined, period || undefined, q || undefined);
  const createMutation = useCreateIndicator();
  const updateMutation = useUpdateIndicator();
  const deleteMutation = useDeleteIndicator();

  const columns: CrudColumn<Indicator>[] = [
    { header: 'Nombre', render: (item) => <span className="font-medium">{item.name}</span> },
    { header: 'Código', render: (item) => <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{item.code}</code> },
    { header: 'Valor', className: 'font-semibold', render: (item) => <span>{formatNumber(item.value)} <span className="text-xs font-normal text-muted-foreground">{item.unit}</span></span> },
    { header: 'Periodo', render: (item) => <Badge variant="outline">{periodLabels[item.period] || item.period}</Badge> },
  ];

  return (
    <CrudPage
        title={t('page.indicators.title')}
        description={t('page.indicators.description')}
        permissionResource="indicators"
        columns={columns}
        queryResult={queryResult}
        createMutation={createMutation}
        updateMutation={updateMutation}
        deleteMutation={deleteMutation}
        page={page}
        onPageChange={setPage}
        searchPlaceholder={t('page.indicators.buscarPlaceholder')}
        onSearch={setQ}
        filterBar={
          <Select value={period} onValueChange={(v) => { setPeriod(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder={t('page.indicators.periodo')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('page.indicators.todos')}</SelectItem>
              <SelectItem value="monthly">{t('page.indicators.mensual')}</SelectItem>
              <SelectItem value="quarterly">{t('page.indicators.trimestral')}</SelectItem>
              <SelectItem value="yearly">{t('page.indicators.anual')}</SelectItem>
            </SelectContent>
          </Select>
        }
        defaultForm={{ name: '', code: '', description: '', unit: '', value: '', source: '', period: '', sector_codigo: '', date: '' }}
        formToPayload={(form) => ({
          name: form.name, code: form.code, description: form.description || undefined,
          unit: form.unit, value: Number(form.value), source: form.source,
          period: form.period as Indicator['period'], sector_codigo: form.sector_codigo || undefined, date: form.date,
        })}
        validateForm={(form) => !form.name ? 'El nombre es obligatorio' : !form.code ? 'El código es obligatorio' : !form.value ? 'El valor es obligatorio' : null}
        renderForm={({ data, onChange }) => (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label htmlFor="indicator-nombre" className="text-sm font-medium">{t('page.organizations.nombre')}</label>
              <Input id="indicator-nombre" value={data.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="Nombre del indicador" />
            </div>
            <div>
              <label htmlFor="indicator-codigo" className="text-sm font-medium">Código *</label>
              <Input id="indicator-codigo" value={data.code} onChange={(e) => onChange({ code: e.target.value })} placeholder="IPI-2025" />
            </div>
            <div>
              <label htmlFor="indicator-valor" className="text-sm font-medium">Valor *</label>
              <Input id="indicator-valor" type="number" step="any" value={data.value} onChange={(e) => onChange({ value: e.target.value })} placeholder="0" />
            </div>
            <div>
              <label htmlFor="indicator-unidad" className="text-sm font-medium">Unidad</label>
              <Input id="indicator-unidad" value={data.unit} onChange={(e) => onChange({ unit: e.target.value })} placeholder="porcentaje" />
            </div>
            <div>
              <label htmlFor="indicator-fuente" className="text-sm font-medium">Fuente</label>
              <Input id="indicator-fuente" value={data.source} onChange={(e) => onChange({ source: e.target.value })} placeholder="ONEI" />
            </div>
            <div>
              <label className="text-sm font-medium">{t('page.indicators.periodo')}</label>
              <Select value={data.period} onValueChange={(v) => onChange({ period: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar periodo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">{t('page.indicators.mensual')}</SelectItem>
                  <SelectItem value="quarterly">{t('page.indicators.trimestral')}</SelectItem>
                  <SelectItem value="yearly">{t('page.indicators.anual')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="indicator-fecha" className="text-sm font-medium">Fecha</label>
              <Input id="indicator-fecha" type="date" value={data.date} onChange={(e) => onChange({ date: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label htmlFor="indicator-descripcion" className="text-sm font-medium">{t('page.publications.resumen')}</label>
              <textarea id="indicator-descripcion" className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={data.description} onChange={(e) => onChange({ description: e.target.value })} placeholder="Descripción del indicador" />
            </div>
          </div>
        )}
        renderSidebar={(item) => (
          <div className="space-y-4">
            <div>
              <p className="text-base font-semibold">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.code}</p>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Valor</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold">{formatNumber(item.value)}</span>
                <span className="text-sm text-muted-foreground">{item.unit}</span>
              </div>
            </div>
            {item.description && (
              <div className="border-t border-border pt-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">{t('page.publications.resumen')}</p>
                <p className="text-sm text-foreground/80 leading-relaxed">{item.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">{t('page.indicators.periodo')}</p>
                <Badge variant="outline">{periodLabels[item.period]}</Badge>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Fecha</p>
                <p className="text-sm">{formatDate(item.date)}</p>
              </div>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Fuente</p>
              <p className="text-sm">{item.source}</p>
            </div>
          </div>
        )}
      />
  );
}
