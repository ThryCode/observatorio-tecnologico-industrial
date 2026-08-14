import { useState, useMemo } from 'react';
import { useEnterpriseGraph, useOrgRecommendations } from '@/hooks/useGraph';
import ForceGraph2D, { type ForceGraphNode } from '@/components/ForceGraph2D';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import EmptyState from '@/components/ui/empty-state';
import { Lightbulb, Loader2, GitBranch } from 'lucide-react';
import type { EnterpriseGraphNode } from '@/types';

export default function EnterpriseGraph() {
  const { data, isLoading } = useEnterpriseGraph();
  const [selected, setSelected] = useState<EnterpriseGraphNode | null>(null);
  const { data: recs, isLoading: recsLoading } = useOrgRecommendations(selected?.id ?? null);

  const stats = useMemo(() => {
    if (!data) return null;
    const orgs = data.nodes.length;
    const connections = data.edges.length;
    const isolated = data.nodes.filter(
      (n) => !data.edges.some((e) => e.source === n.id || e.target === n.id)
    ).length;
    return { orgs, connections, isolated };
  }, [data]);

  const graphNodes = useMemo<ForceGraphNode[]>(
    () =>
      (data?.nodes ?? []).map((n) => ({
        id: n.id,
        label: n.label,
        nodeType: 'Organization',
        subtitle: n.siglas,
      })),
    [data]
  );

  const handleNodeClick = (node: ForceGraphNode | null) => {
    if (!node) return;
    const full = data?.nodes.find((n) => n.id === node.id) ?? null;
    setSelected(full);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Grafo Empresarial</h2>
          <Skeleton className="h-4 w-64 mt-2" />
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
              {graphNodes.length === 0 ? (
                <EmptyState
                  className="h-full"
                  icon={<GitBranch className="h-10 w-10 text-text-muted" />}
                  title="Grafo empresarial vacío"
                  description="Aún no hay relaciones de seguimiento entre empresas registradas."
                />
              ) : (
                <ForceGraph2D
                  nodes={graphNodes}
                  edges={data?.edges ?? []}
                  onNodeClick={handleNodeClick}
                />
              )}
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

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Patentes</p>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                      {selected.patents_active} activas
                    </span>
                    <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
                      {selected.patents_pending} pendientes
                    </span>
                  </div>
                  {selected.patents.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {selected.patents.map((p) => (
                        <div key={p.id} className="rounded-md border border-border p-2 text-xs space-y-1">
                          <p className="font-medium leading-tight">{p.title}</p>
                          <div className="flex justify-between text-muted-foreground">
                            <span>{p.patent_number}</span>
                            <span className={`font-medium ${
                              p.status === 'granted' ? 'text-green-600' :
                              p.status === 'examination' ? 'text-blue-600' :
                              p.status === 'filed' ? 'text-yellow-600' :
                              'text-muted-foreground'
                            }`}>{p.status}</span>
                          </div>
                          {p.filing_date && (
                            <p className="text-muted-foreground">Presentada: {p.filing_date}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No tiene patentes registradas</p>
                  )}
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

        {selected && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Sugerencias del grafo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : recs && recs.items.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Entidades del mismo sector que {recs.org_name || 'la empresa'} aún no sigue:
                  </p>
                  <ul className="space-y-2">
                    {recs.items.map((item) => (
                      <li key={item.id} className="rounded-md border border-border p-2.5 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">{item.label}</p>
                          <Badge variant="secondary" className="shrink-0 text-xs">
                            {item.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.reason}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay sugerencias disponibles para esta empresa.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
