import { useMemo } from 'react';
import { useEnterpriseGraph } from '@/hooks/useGraph';
import ForceGraph2D from '@/components/ForceGraph2D';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function EnterpriseGraph() {
  const { data, isLoading } = useEnterpriseGraph();

  const stats = useMemo(() => {
    if (!data) return null;
    const total = data.nodes.length;
    const nodeIds = new Set(data.nodes.map((n) => n.id));
    const connected = new Set<string>();
    for (const e of data.edges) {
      connected.add(e.source);
      connected.add(e.target);
    }
    const aisladas = total - connected.size;
    return { total, conectadas: connected.size, aisladas, conexiones: data.edges.length };
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Grafo Empresarial</h2>
          <p className="text-muted-foreground">Cargando datos del grafo empresarial...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-[600px] w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Grafo Empresarial</h2>
        <p className="text-muted-foreground">
          Relaciones de seguimiento entre empresas. Una empresa sigue a otra cuando su representante sigue a esa empresa.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Empresas</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.total ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Con Conexiones</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.conectadas ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Aisladas</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.aisladas ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Conexiones</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.conexiones ?? 0}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="h-[600px]">
            <ForceGraph2D
              nodes={data?.nodes ?? []}
              edges={data?.edges ?? []}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}