import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGraphStats, useGraphSearch, useGraphQuery } from '@/hooks/useGraph';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import ForceGraph2D, { type ForceGraphNode } from '@/components/ForceGraph2D';
import { buildGalaxy, buildSystem, primaryType, nodeTypeSpanish } from '@/lib/graphNav';
import { Search, Network, AlertCircle, Loader2, ArrowLeft, MousePointerClick, X, Filter } from 'lucide-react';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { getIndustrialSectors } from '@/api/industrialSectors';
import { queryKeys } from '@/lib/queryKeys';
import { nodeTypeHex } from '@/lib/graph-colors';
import SectorPills from '@/components/SectorPills';

const LEGEND_COLORS = nodeTypeHex;

const LEGEND_ITEMS = [
  { type: 'IndustrialSector', label: 'Sector (sol)' },
  { type: 'Organization', label: 'Organización' },
  { type: 'Technology', label: 'Tecnología' },
  { type: 'Indicator', label: 'Indicador' },
  { type: 'Patent', label: 'Patente' },
  { type: 'Person', label: 'Persona' },
  { type: 'Regulation', label: 'Regulación' },
  { type: 'Cluster', label: 'Agrupacion sin sector' },
];

export default function GraphExplorer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [centerId, setCenterId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<ForceGraphNode | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [activeSectors, setActiveSectors] = useState<string[]>([]);

  const sectorParam = activeSectors.length > 0 ? activeSectors.map((s) => s.toUpperCase()) : undefined;

  const { data: sectorsData } = useQuery({
    queryKey: queryKeys.industrialSectors.list(1, 100),
    queryFn: () => getIndustrialSectors(1, 100),
  });

  const { data: stats, isLoading: statsLoading } = useGraphStats(sectorParam);
  const { data: searchResults, isLoading: searchLoading } = useGraphSearch(activeQuery);
  const { data: graphData, isLoading: graphLoading } = useGraphQuery(500, sectorParam);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const galaxy = useMemo(() => (graphData ? buildGalaxy(graphData) : null), [graphData]);

  const drillExpanded = useMemo(() => {
    if (!centerId || !graphData) return new Set<string>();
    const expandedIds = new Set<string>();
    for (const e of graphData.edges) {
      if (e.source === centerId) expandedIds.add(e.target);
      if (e.target === centerId) expandedIds.add(e.source);
    }
    return expandedIds;
  }, [centerId, graphData]);

  const visible = useMemo(() => {
    if (!graphData) return null;
    if (!centerId) {
      return {
        nodes: galaxy?.nodes ?? [],
        edges: galaxy?.edges ?? [],
      };
    }
    const system = buildSystem(graphData, centerId, drillExpanded);
    return { nodes: system.nodes, edges: system.edges };
  }, [graphData, centerId, galaxy, drillExpanded]);

  const currentCenterLabel = useMemo(() => {
    if (!centerId) return null;
    return graphData?.nodes.find((n) => n.id === centerId)?.props.nombre?.toString().split('(')[0].trim() ?? 'Nodo';
  }, [centerId, graphData]);

  const goBack = () => {
    const prev = history[history.length - 1];
    if (prev) {
      setHistory((h) => h.slice(0, -1));
      setCenterId(prev);
      setSelectedNode(null);
    } else {
      setCenterId(null);
      setSelectedNode(null);
    }
  };

  const focusNode = (id: string) => {
    setHistory((h) => (centerId ? [...h, centerId] : h));
    setCenterId(id);
    setSelectedNode(null);
  };

  const handleNodeClick = (node: ForceGraphNode | null) => {
    if (!node) {
      setSelectedNode(null);
      return;
    }
    setSelectedNode(node);
    if (node.id === centerId) {
      goBack();
      return;
    }
    focusNode(node.id);
  };

  const handleExpandNode = (id: string) => {
    if (id === centerId) {
      goBack();
      return;
    }
    focusNode(id);
  };

  const hasFocus = centerId !== null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Explorador del Grafo</h2>
          <p className="text-muted-foreground">
            Explora el grafo de conocimiento: desplazate con el mouse y entra en cada sector para ver sus conexiones.
          </p>
        </div>
        {hasFocus && (
          <Button variant="outline" onClick={goBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Ver grafo completo
          </Button>
        )}
      </div>

      {hasFocus && currentCenterLabel && (
        <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-4 py-2 text-sm">
          <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Sistema de:</span>
          <span className="font-semibold">{currentCenterLabel}</span>
          <Badge variant="secondary" className="ml-2 text-xs">
            clic en un nodo para ver sus conexiones
          </Badge>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={goBack}>
            <X className="mr-1 h-3.5 w-3.5" />
            Cerrar
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          : (stats ?? []).slice(0, 4).map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.count}</div>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-lg">
                  {hasFocus ? `Conexiones de: ${currentCenterLabel ?? ''}` : 'Grafo de conocimiento'}
                </CardTitle>
                {graphLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[620px]">
                <SectionErrorBoundary title="Visualización del Grafo">
                  {graphLoading || !visible ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : visible.nodes.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                      No hay nodos para visualizar.
                    </div>
                  ) : (
                    <ForceGraph2D
                      nodes={visible.nodes}
                      edges={visible.edges}
                      centerId={centerId}
                      hideCenter={hasFocus}
                      onNodeClick={handleNodeClick}
                      onExpandNode={handleExpandNode}
                      showEdgeLabels
                    />
                  )}
                </SectionErrorBoundary>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-lg">Leyenda</CardTitle>
                {hasFocus && (
                  <Button variant="ghost" size="sm" onClick={() => setCenterId(null)}>
                    Volver a la galaxia
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
                {LEGEND_ITEMS.map((item) => (
                  <div key={item.type} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: LEGEND_COLORS[item.type] }}
                    />
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Arrastra el fondo con el mouse para desplazarte y usa la rueda para hacer zoom. Clic en
                un nodo para ver sus conexiones (aparece como titulo arriba); doble clic lo adentra.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-lg">Buscar en el Grafo</CardTitle>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Filter className="h-3.5 w-3.5" />
                  Sector
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <SectorPills
                  sectors={(sectorsData?.items ?? []).map((s) => ({ id: s.codigo, label: s.nombre, count: 0 }))}
                  active={activeSectors}
                  onChange={setActiveSectors}
                />
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Tecnologia, patente, organizacion..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button onClick={() => setActiveQuery(debouncedQuery)} disabled={!debouncedQuery}>
                    Buscar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {searchLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          )}

          {searchResults && searchResults.items.length === 0 && activeQuery && (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-6">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No se encontraron resultados para &quot;{activeQuery}&quot;
                </p>
              </CardContent>
            </Card>
          )}

          {searchResults && searchResults.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  {searchResults.total} resultado(s) · clic para centrar en el grafo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {searchResults.items.map((result: unknown, i: number) => {
                  const node = (result as Record<string, unknown>).n as Record<string, unknown> | undefined;
                  const labels = (result as Record<string, unknown>).node_labels as string[] | undefined;
                  const id = typeof node?.id === 'string' ? node.id : typeof node?.code === 'string' ? node.code : undefined;
                  return (
                    <Button
                      key={id ?? `result-${i}`}
                      variant="outline"
                      className="w-full justify-start h-auto py-3"
                      onClick={() => {
                        if (id) focusNode(id);
                        setActiveQuery('');
                        setSearchQuery('');
                      }}
                    >
                      <div className="flex items-center gap-3 w-full min-w-0">
                        <Network className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {typeof node?.name === 'string' ? node.name :
                             typeof node?.title === 'string' ? node.title :
                             typeof node?.nombre === 'string' ? node.nombre :
                             typeof node?.id === 'string' ? node.id : 'Nodo'}
                          </p>
                          {labels?.length ? (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {labels.map((label) => (
                                <span
                                  key={label}
                                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
                                  style={{ backgroundColor: `${LEGEND_COLORS[primaryType([label])] ?? '#64748b'}26`, color: LEGEND_COLORS[primaryType([label])] ?? '#64748b' }}
                                >
                                  {nodeTypeSpanish(primaryType([label]))}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {selectedNode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Nodo seleccionado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-lg font-semibold">{selectedNode.label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: LEGEND_COLORS[selectedNode.nodeType] }}
                    />
                    <Badge variant="secondary" className="text-xs">
                      {nodeTypeSpanish(selectedNode.nodeType)}
                    </Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => focusNode(selectedNode.id)}
                >
                  Ver conexiones de este nodo
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
