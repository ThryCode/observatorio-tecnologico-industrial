import { usePatents } from '@/hooks/usePatents';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useRegulations } from '@/hooks/useRegulations';
import { useIndicators } from '@/hooks/useIndicators';
import KPIs from '@/components/KPIs';
import GraficoPatentes from '@/components/GraficoPatentes';
import AlertasTable from '@/components/AlertasTable';
import type { KpiData } from '@/types';

export default function Dashboard() {
  const { data: patents } = usePatents(1, 1);
  const { data: orgs } = useOrganizations(1, 1);
  const { data: regulations } = useRegulations(1, 1);
  const { data: indicators } = useIndicators(1, 1);

  const kpis: KpiData[] = [
    { title: 'Total Patentes', value: patents?.total.toLocaleString('es-ES') ?? '—', change: '+12%', changeType: 'positive', icon: 'FileText' },
    { title: 'Organizaciones', value: orgs?.total.toLocaleString('es-ES') ?? '—', change: '+3', changeType: 'positive', icon: 'Building2' },
    { title: 'Normativas', value: regulations?.total.toLocaleString('es-ES') ?? '—', change: '+8%', changeType: 'positive', icon: 'Scale' },
    { title: 'Indicadores', value: indicators?.total.toLocaleString('es-ES') ?? '—', change: '+5%', changeType: 'positive', icon: 'TrendingUp' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Resumen general del Observatorio Tecnológico Industrial.
        </p>
      </div>
      <KPIs data={kpis} />
      <div className="grid gap-4 md:grid-cols-3">
        <GraficoPatentes />
        <AlertasTable />
      </div>
    </div>
  );
}
