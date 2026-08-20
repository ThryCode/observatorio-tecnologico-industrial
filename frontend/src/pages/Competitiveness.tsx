import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useCompetitiveness } from '@/hooks/useCompetitiveness';
import { getIndustrialSectors } from '@/api/industrialSectors';
import { chartColors } from '@/lib/graph-colors';
import { queryKeys } from '@/lib/queryKeys';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { BarChart3, X } from 'lucide-react';

const PERIODS = ['2026', '2025', '2024', '2023'];

const COUNTRY_COLORS: Record<string, string> = {
  Cuba: chartColors.accent,
  Chile: chartColors.gold,
  México: chartColors.blue,
  Brasil: chartColors.green,
};

export default function Competitiveness() {
  const [sector, setSector] = useState('all');
  const [period, setPeriod] = useState('all');
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  const sectorParam = sector === 'all' ? undefined : sector;
  const periodParam = period === 'all' ? undefined : period;

  const toggleSector = (s: string) => setSelectedSector((prev) => (prev === s ? null : s));

  const { data, isLoading } = useCompetitiveness(periodParam, sectorParam);

  const { data: sectorsData } = useQuery({
    queryKey: queryKeys.industrialSectors.list(1, 100),
    queryFn: () => getIndustrialSectors(1, 100),
  });

  const paises = useMemo(() => data?.paises ?? [], [data?.paises]);
  const chartData = data?.chartData ?? [];
  const items = data?.items ?? [];
  const detailItems = selectedSector ? items.filter((i) => i.sector === selectedSector) : items;

  const palette = useMemo(() => {
    const defaults = [chartColors.accent, chartColors.gold, chartColors.blue, chartColors.green];
    return paises.map((p, i) => COUNTRY_COLORS[p] ?? defaults[i % defaults.length]);
  }, [paises]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Análisis de Competitividad"
        highlight="Competitividad"
        description="Benchmarking industrial por sectores: comparativa de indicadores clave entre Cuba y países de referencia en América Latina."
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={sector} onValueChange={setSector}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Sector" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los sectores</SelectItem>
            {(sectorsData?.items ?? []).map((s) => (
              <SelectItem key={s.codigo} value={s.codigo}>{s.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {PERIODS.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-[320px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      ) : !data || chartData.length === 0 ? (
        <div className="bg-surface rounded-lg border border-border">
          <EmptyState
            icon={<BarChart3 className="h-10 w-10 text-text-muted" />}
            title="Sin datos de competitividad"
            description="No hay datos disponibles para los filtros seleccionados."
          />
        </div>
      ) : (
        <SectionErrorBoundary title="Gráfico de Competitividad">
          {/* Chart */}
          <div className="bg-surface rounded-lg border border-border p-6">
            <h3 className="text-base font-bold text-foreground mb-1">Índice de Competitividad Industrial por Sector</h3>
            <p className="text-xs text-muted-foreground mb-4">Haz clic en un sector del gráfico para filtrar la tabla de detalle (drill-down).</p>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  onClick={(state: { activeLabel?: string }) => {
                    const s = state?.activeLabel;
                    if (s) toggleSector(s);
                  }}
                  className="cursor-pointer"
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border-subtle" />
                  <XAxis dataKey="sector" className="text-xs text-text-muted" onClick={(e) => e && toggleSector(String(e.value))} />
                  <YAxis className="text-xs text-text-muted" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--surface))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  {paises.map((pais, i) => (
                    <Bar
                      key={pais}
                      dataKey={pais}
                      name={pais}
                      fill={palette[i]}
                      radius={[4, 4, 0, 0]}
                      onClick={(data: { sector?: string }) => data?.sector && toggleSector(data.sector)}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detail table */}
          <div className="bg-surface rounded-lg border border-border mt-6">
            <div className="p-6 pb-0 flex items-center justify-between gap-3 flex-wrap">
              <h3 className="text-base font-bold text-foreground mb-4">Datos Detallados</h3>
              {selectedSector && (
                <button
                  onClick={() => setSelectedSector(null)}
                  className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-sm text-foreground hover:bg-muted/50"
                >
                  Drill-down: {selectedSector}
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="max-h-[480px] overflow-y-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sector</TableHead>
                  <TableHead>Indicador</TableHead>
                  <TableHead>País</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Fuente</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailItems.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.sector}</TableCell>
                    <TableCell>{row.indicador}</TableCell>
                    <TableCell>{row.pais}</TableCell>
                    <TableCell className="text-muted-foreground">{row.periodo}</TableCell>
                    <TableCell className="text-right font-semibold">{row.valor}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{row.fuente ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {detailItems.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">No hay datos para el sector seleccionado.</div>
            )}
            </div>
          </div>
        </SectionErrorBoundary>
      )}
    </div>
  );
}
