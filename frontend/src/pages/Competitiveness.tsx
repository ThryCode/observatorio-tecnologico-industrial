import PageHeader from '@/components/PageHeader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useCompetitiveness } from '@/hooks/useCompetitiveness';
import { chartColors } from '@/lib/graph-colors';

export default function Competitiveness() {
  const { data, isLoading } = useCompetitiveness();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Análisis de Competitividad"
        highlight="Competitividad"
        description="Benchmarking industrial por sectores: comparativa de indicadores clave entre Cuba y países de referencia en América Latina."
      />
      <div className="bg-surface rounded-lg border border-border p-6">
        <h3 className="text-base font-bold text-foreground mb-4">Índice de Competitividad Industrial por Sector</h3>
        {isLoading ? (
          <div className="text-center text-text-muted py-8">Cargando datos de competitividad...</div>
        ) : (
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
                <Bar dataKey="Cuba" fill={chartColors.accent} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Chile" fill={chartColors.gold} radius={[4, 4, 0, 0]} />
                <Bar dataKey="México" fill={chartColors.blue} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Brasil" fill={chartColors.green} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
