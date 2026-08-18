import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePatentMaps } from '@/hooks/usePatentMaps';
import { getIndustrialSectors } from '@/api/industrialSectors';
import { chartColors } from '@/lib/graph-colors';
import { queryKeys } from '@/lib/queryKeys';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { MapIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const COUNTRIES = [
  { value: 'all', label: 'Todos' },
  { value: 'CU', label: 'Cuba' },
  { value: 'US', label: 'EE.UU.' },
  { value: 'CN', label: 'China' },
  { value: 'JP', label: 'Japón' },
  { value: 'DE', label: 'Alemania' },
  { value: 'KR', label: 'Corea del Sur' },
];

export default function PatentMaps() {
  const [sector, setSector] = useState('all');
  const [country, setCountry] = useState('all');

  const sectorParam = sector === 'all' ? undefined : sector;
  const countryParam = country === 'all' ? undefined : country;

  const { data, isLoading } = usePatentMaps(countryParam, sectorParam);

  const { data: sectorsData } = useQuery({
    queryKey: queryKeys.industrialSectors.list(1, 100),
    queryFn: () => getIndustrialSectors(1, 100),
  });

  const chartData = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, number>();
    for (const item of data) {
      map.set(item.tecnologia, (map.get(item.tecnologia) || 0) + item.total_patentes);
    }
    return Array.from(map.entries())
      .map(([tecnologia, patentes]) => ({ tecnologia, patentes }))
      .sort((a, b) => b.patentes - a.patentes);
  }, [data]);

  const maxPatentes = chartData.length > 0 ? Math.max(...chartData.map((d) => d.patentes)) : 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mapas de Patentes"
        highlight="Patentes"
        description="Distribución de la actividad patentaria por dominios tecnológicos de interés industrial."
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

        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="País" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-[320px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      ) : !data || data.length === 0 ? (
        <div className="bg-surface rounded-lg border border-border">
          <EmptyState
            icon={<MapIcon className="h-10 w-10 text-text-muted" />}
            title="Sin mapas de patentes"
            description="No hay datos de actividad patentaria disponibles para los filtros seleccionados."
          />
        </div>
      ) : (
        <SectionErrorBoundary title="Mapa de Patentes">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Chart */}
            <div className="bg-surface rounded-lg border border-border p-6">
              <h3 className="text-base font-bold text-foreground mb-4">Patentes por Tecnología</h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border-subtle" horizontal={false} />
                    <XAxis type="number" className="text-xs text-text-muted" />
                    <YAxis dataKey="tecnologia" type="category" className="text-xs text-text-muted" width={110} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--surface))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="patentes" fill={chartColors.accent} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Summary bars */}
            <div className="bg-surface rounded-lg border border-border p-6">
              <h3 className="text-base font-bold text-foreground mb-4">Resumen</h3>
              <div className="space-y-4">
                {chartData.map((item) => (
                  <div key={item.tecnologia} className="flex items-center gap-3">
                    <span className="w-32 text-sm text-text-muted truncate shrink-0">{item.tecnologia}</span>
                    <div className="flex-1 h-2 bg-border-subtle rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent-red to-brick transition-all"
                        style={{ width: `${(item.patentes / maxPatentes) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-foreground w-8 text-right shrink-0">{item.patentes}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detail table */}
          <div className="bg-surface rounded-lg border border-border mt-6">
            <div className="p-6 pb-0">
              <h3 className="text-base font-bold text-foreground mb-4">Detalle por País</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tecnología</TableHead>
                  <TableHead>País</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead className="text-right">Patentes</TableHead>
                  <TableHead>Tendencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={`${row.id}`}>
                    <TableCell className="font-medium">{row.tecnologia}</TableCell>
                    <TableCell>{row.pais}</TableCell>
                    <TableCell className="text-muted-foreground">{row.periodo}</TableCell>
                    <TableCell className="text-right font-semibold">{row.total_patentes}</TableCell>
                    <TableCell>
                      <Badge
                        variant={row.tendencia === 'up' ? 'default' : 'secondary'}
                        className="gap-1"
                      >
                        {row.tendencia === 'up' ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {row.tendencia === 'up' ? 'Sube' : 'Baja'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionErrorBoundary>
      )}
    </div>
  );
}
