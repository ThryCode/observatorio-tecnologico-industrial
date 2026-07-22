import PageHeader from '@/components/PageHeader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { tecnologia: 'Reducción Directa', patentes: 34 },
  { tecnologia: 'Sensores IoT', patentes: 28 },
  { tecnologia: 'Bioprocesos', patentes: 22 },
  { tecnologia: 'Energía Solar', patentes: 19 },
  { tecnologia: 'Materiales Compuestos', patentes: 15 },
  { tecnologia: 'Hidrógeno Verde', patentes: 12 },
  { tecnologia: 'Automatización', patentes: 10 },
  { tecnologia: 'Nanomateriales', patentes: 8 },
];

export default function PatentMaps() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Mapas de Patentes"
        highlight="Patentes"
        description="Distribución de la actividad patentaria por dominios tecnológicos de interés industrial."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-surface rounded-lg border border-border p-6">
          <h3 className="text-base font-bold text-foreground mb-4">Patentes por Tecnología</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border-subtle" horizontal={false} />
                <XAxis type="number" className="text-xs text-text-muted" />
                <YAxis dataKey="tecnologia" type="category" className="text-xs text-text-muted" width={130} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--surface))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="patentes" fill="#E86A33" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-surface rounded-lg border border-border p-6">
          <h3 className="text-base font-bold text-foreground mb-4">Resumen del Mapa</h3>
          <div className="space-y-4">
            {data.map((item) => (
              <div key={item.tecnologia} className="flex items-center gap-3">
                <span className="w-32 text-sm text-text-muted truncate">{item.tecnologia}</span>
                <div className="flex-1 h-2 bg-border-subtle rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent-orange to-gold"
                    style={{ width: `${(item.patentes / 34) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-foreground w-8 text-right">{item.patentes}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
