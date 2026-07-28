import { useMemo } from 'react';
import { useEnterpriseGraph } from '@/hooks/useGraph';
import ForceGraph2D from '@/components/ForceGraph2D';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function EnterpriseGraph() {
  const { data, isLoading } = useEnterpriseGraph();

  const stats = useMemo(() => {
    if (!data) return null;
    const persons = data.nodes.filter((n) => n.type === 'person').length;
    const orgs = data.nodes.filter((n) => n.type === 'organization').length;
    const follows = data.edges.filter((e) => e.type === 'FOLLOWS').length;
    const represents = data.edges.filter((e) => e.type === 'REPRESENTS').length;
    return { persons, orgs, follows, represents };
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
          Visualización de empresas, representantes y relaciones de seguimiento.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Representantes</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.persons ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Empresas</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.orgs ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Seguimientos</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.follows ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Representaciones</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.represents ?? 0}</div></CardContent>
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