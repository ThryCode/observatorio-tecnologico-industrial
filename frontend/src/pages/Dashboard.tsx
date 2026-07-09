import KPIs from '@/components/KPIs';
import GraficoPatentes from '@/components/GraficoPatentes';
import AlertasTable from '@/components/AlertasTable';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Resumen general del Observatorio Tecnológico Industrial.
        </p>
      </div>
      <KPIs />
      <div className="grid gap-4 md:grid-cols-3">
        <GraficoPatentes />
        <AlertasTable />
      </div>
    </div>
  );
}
