import { useState, useMemo } from 'react';
import { useEnterpriseGraph } from '@/hooks/useGraph';
import ForceGraph2D from '@/components/ForceGraph2D';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { EnterpriseGraphNode } from '@/types';

export default function EnterpriseGraph() {
  const { data, isLoading } = useEnterpriseGraph();
  const [selected, setSelected] = useState<EnterpriseGraphNode | null>(null);

  const stats = useMemo(() => {
    if (!data) return null;
    const orgs = data.nodes.length;
    const connections = data.edges.length;
    const isolated = data.nodes.filter(
      (n) => !data.edges.some((e) => e.source === n.id || e.target === n.id)
    ).length;
    return { orgs, connections, isolated };
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Grafo Empresarial</h2>
          <p className="text-muted-foreground">Cargando datos del grafo empresarial...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
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
          Relaciones de seguimiento entre empresas. Un arco indica que una empresa sigue a otra.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Empresas</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.orgs ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Conexiones</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.connections ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Nodos aislados</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.isolated ?? 0}</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            <div className="h-[600px]">
              <ForceGraph2D
                nodes={data?.nodes ?? []}
                edges={data?.edges ?? []}
                onNodeClick={(node) => setSelected(node)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {selected ? 'Detalles de la empresa' : 'Selecciona un nodo'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selected ? (
              <div className="space-y-4">
                <div>
                  <p className="text-lg font-semibold">{selected.label}</p>
                  <p className="text-sm text-muted-foreground">{selected.siglas}</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-border pb-1">
                    <span className="text-muted-foreground">Tipo</span>
                    <span className="font-medium capitalize">{selected.tipo || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-1">
                    <span className="text-muted-foreground">Sector</span>
                    <span className="font-medium">{selected.sector || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-1">
                    <span className="text-muted-foreground">Provincia</span>
                    <span className="font-medium">{selected.provincia || '—'}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pt-2">Haz clic en otro nodo para ver sus datos</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Haz clic sobre cualquier nodo del grafo para ver su información.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
