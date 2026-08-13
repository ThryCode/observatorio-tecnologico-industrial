import { useState } from 'react';
import CrudPage from '@/components/CrudPage';
import type { CrudColumn } from '@/components/CrudPage';
import { useIndicators, useCreateIndicator, useUpdateIndicator, useDeleteIndicator } from '@/hooks/useIndicators';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDate, formatNumber } from '@/utils/formatters';
import { TrendingUp } from 'lucide-react';
import type { Indicator } from '@/types';

const periodLabels: Record<string, string> = {
  monthly: 'Mensual', quarterly: 'Trimestral', yearly: 'Anual',
};

export default function Indicators() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [period, setPeriod] = useState('');
  const [selected, setSelected] = useState<Indicator | null>(null);

  const queryResult = useIndicators(page, 20, undefined, period || undefined, q || undefined);
  const createMutation = useCreateIndicator();
  const updateMutation = useUpdateIndicator();
  const deleteMutation = useDeleteIndicator();

  const columns: CrudColumn<Indicator>[] = [
    { header: 'Nombre', render: (item) => <button className="font-medium hover:underline text-left" onClick={() => setSelected(item)}>{item.name}</button> },
    { header: 'Código', render: (item) => <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{item.code}</code> },
    { header: 'Valor', className: 'font-semibold', render: (item) => formatNumber(item.value) },
    { header: 'Unidad', render: (item) => item.unit },
    { header: 'Periodo', render: (item) => <Badge variant="outline">{periodLabels[item.period] || item.period}</Badge> },
    { header: 'Fuente', render: (item) => item.source },
  ];

  return (
    <>
      <CrudPage
        title="Indicadores"
        description="Indicadores de ciencia, tecnología e innovación del sector industrial."
        permissionResource="indicators"
        columns={columns}
        queryResult={queryResult}
        createMutation={createMutation}
        updateMutation={updateMutation}
        deleteMutation={deleteMutation}
        page={page}
        onPageChange={setPage}
        searchPlaceholder="Buscar indicadores..."
        onSearch={setQ}
        filterBar={
          <Select value={period} onValueChange={(v) => { setPeriod(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Periodo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="monthly">Mensual</SelectItem>
              <SelectItem value="quarterly">Trimestral</SelectItem>
              <SelectItem value="yearly">Anual</SelectItem>
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
              <label htmlFor="indicator-nombre" className="text-sm font-medium">Nombre *</label>
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
              <label className="text-sm font-medium">Periodo</label>
              <Select value={data.period} onValueChange={(v) => onChange({ period: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar periodo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="indicator-fecha" className="text-sm font-medium">Fecha</label>
              <Input id="indicator-fecha" type="date" value={data.date} onChange={(e) => onChange({ date: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label htmlFor="indicator-descripcion" className="text-sm font-medium">Descripción</label>
              <textarea id="indicator-descripcion" className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={data.description} onChange={(e) => onChange({ description: e.target.value })} placeholder="Descripción del indicador" />
            </div>
          </div>
        )}
      />

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selected?.name}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Valor:</span>
                <span className="text-xl font-bold">{formatNumber(selected.value)}</span>
                <span className="text-muted-foreground">{selected.unit}</span>
              </div>
              {selected.description && <p className="text-sm text-muted-foreground">{selected.description}</p>}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Código:</span><p className="text-muted-foreground">{selected.code}</p></div>
                <div><span className="font-medium">Periodo:</span><p className="text-muted-foreground">{periodLabels[selected.period]}</p></div>
                <div><span className="font-medium">Fuente:</span><p className="text-muted-foreground">{selected.source}</p></div>
                <div><span className="font-medium">Fecha:</span><p className="text-muted-foreground">{formatDate(selected.date)}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
