import { useState, useMemo } from 'react';
import { useGraphStats, useGraphExplore, useGraphSync, useShortestPath } from '@/hooks/useGraph';
import { useAuth } from '@/contexts/AuthContext';
import { searchGraphNodes } from '@/api/graph';
import { usePermissions } from '@/hooks/usePermissions';
import ForceGraph2D from '@/components/ForceGraph2D';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Network, AlertCircle, RefreshCw, Route, Eye, EyeOff } from 'lucide-react';
import type { GraphNodeData, GraphLinkData } from '@/api/graph';

const LABEL_COLORS: Record<string, string> = {
  Organization: '#f59e0b',
  Technology: '#3b82f6',
  Patent: '#10b981',
  Regulation: '#8b5cf6',
  Indicator: '#ec4899',
  IndustrialSector: '#14b8a6',
  Person: '#f97316',
};

export default function GraphExplorer() {
  const { can } = usePermissions();
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin_mindus';
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ items: unknown[]; total: number } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeData, setSelectedNodeData] = useState<GraphNodeData | null>(null);
  const [showShortestPath, setShowShortestPath] = useState(false);
  const [pathFrom, setPathFrom] = useState('');
  const [pathTo, setPathTo] = useState('');
  const [showPath, setShowPath] = useState(false);

  const { data: stats, isLoading: statsLoading } = useGraphStats();
  const { data: exploreData, isLoading: exploreLoading } = useGraphExplore(selectedNodeId || '', 2);
  const syncMutation = useGraphSync();
  const pathQuery = useShortestPath(pathFrom, pathTo, showPath);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await searchGraphNodes(searchQuery);
      setSearchResults(res);
      if (res.items.length > 0) {
        const first = res.items[0] as { n: Record<string, unknown>; node_labels: string[] };
        const nodeId = first.n?.elementId as string || first.n?.id as string;
        if (nodeId) setSelectedNodeId(nodeId);
      }
    } finally {
      setSearchLoading(false);
    }
  };

  const handleNodeClick = (id: string) => {
    setSelectedNodeId(id);
    if (exploreData?.nodes) {
      const nd = exploreData.nodes.find((n: GraphNodeData) => n.id === id || n.properties?.id === id);
      if (nd) setSelectedNodeData(nd);
    }
  };

  const graphData = useMemo(() => {
    if (!exploreData) return { nodes: [], links: [] };
    const nodes: { id: string; labels: string[] }[] = (exploreData.nodes || []).map((n: GraphNodeData) => ({
      id: n.id || (n.properties?.id as string) || '',
      labels: n.labels || [],
    }));
    const links: { source: string; target: string; type: string }[] = (exploreData.relationships || []).map((r: GraphLinkData) => ({
      source: r.source || '',
      target: r.target || '',
      type: r.type || '',
    }));
    return { nodes: nodes.filter((n) => n.id), links: links.filter((l) => l.source && l.target) };
  }, [exploreData]);

  const detailNode = useMemo(() => {
    if (!selectedNodeData || !exploreData) return null;
    const props = selectedNodeData.properties || {};
    const labels = selectedNodeData.labels || [];
    return { id: selectedNodeData.id, labels, props };
  }, [selectedNodeData, exploreData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Explorador del Grafo</h2>
          <p className="text-muted-foreground">Visualización y exploración del grafo de conocimiento industrial.</p>
        </div>
        {isAdmin && (
          <Button variant="outline" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            {syncMutation.isPending ? 'Sincronizando...' : 'Sincronizar Neo4j'}
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {statsLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}><CardHeader className="pb-2"><Skeleton className="h-4 w-20" /></CardHeader><CardContent><Skeleton className="h-8 w-12" /></CardContent></Card>
            ))
          : stats?.map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">{stat.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: LABEL_COLORS[stat.label] || '#6b7280' }} />
                    <span className="text-2xl font-bold">{stat.count}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Graph + Search */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar nodos en el grafo..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }} />
                </div>
                <Button onClick={handleSearch} disabled={!searchQuery || searchLoading}>Buscar</Button>
              </div>
              {searchResults && (
                <p className="text-xs text-muted-foreground mt-2">{searchResults.total} resultado(s) encontrado(s)</p>
              )}
            </CardContent>
          </Card>

          {/* Graph canvas */}
          <Card className="overflow-hidden">
            <CardContent className="p-0 relative" style={{ height: 500 }}>
              {exploreLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-orange" />
                </div>
              )}
              {!selectedNodeId && !exploreLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <Network className="h-12 w-12" />
                  <p>Busca un nodo para visualizar el grafo</p>
                </div>
              )}
              {selectedNodeId && (
                <ForceGraph2D
                  nodes={graphData.nodes}
                  links={graphData.links}
                  onNodeClick={handleNodeClick}
                  width={800}
                  height={500}
                />
              )}
            </CardContent>
          </Card>

          {/* Shortest path */}
          <Card>
            <CardContent className="p-4">
              <button className="flex items-center gap-2 text-sm font-medium mb-3" onClick={() => setShowShortestPath(!showShortestPath)}>
                {showShortestPath ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                Camino más corto entre dos nodos
              </button>
              {showShortestPath && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input placeholder="ID del nodo origen" value={pathFrom} onChange={(e) => setPathFrom(e.target.value)} />
                    <Input placeholder="ID del nodo destino" value={pathTo} onChange={(e) => setPathTo(e.target.value)} />
                    <Button onClick={() => setShowPath(true)} disabled={!pathFrom || !pathTo}>
                      <Route className="h-4 w-4 mr-1" /> Buscar
                    </Button>
                  </div>
                  {pathQuery.data && (
                    <div className="text-sm text-muted-foreground">
                      <p><span className="font-medium">Distancia:</span> {pathQuery.data.weight}</p>
                      <p><span className="font-medium">Relaciones:</span> {pathQuery.data.rel_types?.join(' → ') || '-'}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Node detail panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Detalle del nodo</CardTitle>
            </CardHeader>
            <CardContent>
              {!detailNode && (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8" />
                  <p className="text-sm">Haz clic en un nodo del grafo para ver sus propiedades</p>
                </div>
              )}
              {detailNode && (
                <div className="space-y-3 text-sm">
                  <div className="flex gap-2 flex-wrap">
                    {detailNode.labels.map((lbl) => (
                      <Badge key={lbl} style={{ backgroundColor: LABEL_COLORS[lbl] || '#6b7280' }} className="text-white">{lbl}</Badge>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    {Object.entries(detailNode.props).filter(([k]) => !k.startsWith('_')).map(([key, val]) => (
                      <div key={key} className="flex justify-between gap-2">
                        <span className="font-medium text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
                        <span className="text-right truncate max-w-[180px]">{val !== null && val !== undefined ? String(val) : '-'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {syncMutation.data && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Sincronización</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>Nodos: {syncMutation.data.nodes_merged}</p>
                <p>Relaciones: {syncMutation.data.relationships_merged}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}