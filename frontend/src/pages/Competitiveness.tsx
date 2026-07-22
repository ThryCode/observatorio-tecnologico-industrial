import PageHeader from '@/components/PageHeader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const data = [
  { sector: 'Siderurgia', Cuba: 42, Chile: 78, México: 65, Brasil: 91 },
  { sector: 'Metalurgia', Cuba: 38, Chile: 72, México: 58, Brasil: 85 },
  { sector: 'Química', Cuba: 55, Chile: 60, México: 70, Brasil: 88 },
  { sector: 'Electrónica', Cuba: 28, Chile: 55, México: 62, Brasil: 70 },
  { sector: 'Biotecnología', Cuba: 72, Chile: 45, México: 50, Brasil: 68 },
  { sector: 'Energía', Cuba: 35, Chile: 68, México: 55, Brasil: 80 },
];

export default function Competitiveness() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Análisis de Competitividad"
        highlight="Competitividad"
        description="Benchmarking industrial por sectores: comparativa de indicadores clave entre Cuba y países de referencia en América Latina."
      />
      <div className="bg-surface rounded-lg border border-border p-6">
        <h3 className="text-base font-bold text-foreground mb-4">Índice de Competitividad Industrial por Sector</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border-subtle" />
              <XAxis dataKey="sector" className="text-xs text-text-muted" />
              <YAxis className="text-xs text-text-muted" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--surface))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="Cuba" fill="#E86A33" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Chile" fill="#C9A84C" radius={[4, 4, 0, 0]} />
              <Bar dataKey="México" fill="#2980B9" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Brasil" fill="#2D8A4E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
