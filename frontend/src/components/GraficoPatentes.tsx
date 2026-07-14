import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePatents } from '@/hooks/usePatents';

const sectorNombres: Record<string, string> = {
  SID: 'Siderurgia',
  MET: 'Metalurgia',
  ELE: 'Electrónica',
  QUI: 'Química',
  AUT: 'Automación',
  ENE: 'Energía',
  BIO: 'Biotecnología',
  TIC: 'TIC',
  NAN: 'Nanotecnología',
};

export default function GraficoPatentes() {
  const { data } = usePatents(1, 100);

  const sectorCounts: Record<string, number> = {};
  (data?.items ?? []).forEach((p) => {
    const code = p.technological_sector ?? 'Otros';
    sectorCounts[code] = (sectorCounts[code] || 0) + 1;
  });

  const chartData = Object.entries(sectorCounts)
    .map(([code, count]) => ({
      sector: sectorNombres[code] || code,
      patentes: count,
    }))
    .sort((a, b) => b.patentes - a.patentes);

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Patentes por Sector Tecnológico</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.length > 0 ? chartData : [{ sector: 'Sin datos', patentes: 0 }]} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="sector" className="text-xs text-muted-foreground" />
              <YAxis className="text-xs text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="patentes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Patentes" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
