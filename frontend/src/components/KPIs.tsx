import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Building2, Scale, TrendingUp } from 'lucide-react';
import type { KpiData } from '@/types';

const defaultKpis: KpiData[] = [
  { title: 'Total Patentes', value: '1,284', change: '+12%', changeType: 'positive', icon: 'FileText' },
  { title: 'Organizaciones', value: '48', change: '+3', changeType: 'positive', icon: 'Building2' },
  { title: 'Normativas', value: '156', change: '+8%', changeType: 'positive', icon: 'Scale' },
  { title: 'Indicadores', value: '892', change: '+5%', changeType: 'positive', icon: 'TrendingUp' },
];

const iconMap: Record<string, React.ElementType> = {
  FileText,
  Building2,
  Scale,
  TrendingUp,
};

interface KPIsProps {
  data?: KpiData[];
}

export default function KPIs({ data }: KPIsProps) {
  const items = data || defaultKpis;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((kpi) => {
        const Icon = iconMap[kpi.icon] || TrendingUp;
        return (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p
                className={cn(
                  'text-xs',
                  kpi.changeType === 'positive' && 'text-green-600',
                  kpi.changeType === 'negative' && 'text-red-600',
                  kpi.changeType === 'neutral' && 'text-muted-foreground',
                )}
              >
                {kpi.change} respecto al mes anterior
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
