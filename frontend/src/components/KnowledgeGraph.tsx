import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import ForceGraph2D from '@/components/ForceGraph2D';
import { useGraphQuery } from '@/hooks/useGraph';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { buildGalaxy } from '@/lib/graphNav';
import { nodeTypeHex } from '@/lib/graph-colors';

interface KnowledgeGraphProps {
  className?: string;
  height?: number;
  sectorCodigos?: string[];
}

const legendItems: { type: string; label: string }[] = [
  { type: 'Technology', label: 'Tecnologías' },
  { type: 'Organization', label: 'Organizaciones' },
  { type: 'IndustrialSector', label: 'Sectores industriales' },
  { type: 'Person', label: 'Personas' },
  { type: 'Indicator', label: 'Indicadores' },
  { type: 'Patent', label: 'Patentes' },
  { type: 'Regulation', label: 'Regulaciones' },
];

export default function KnowledgeGraph({ className, height = 400, sectorCodigos }: KnowledgeGraphProps) {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useGraphQuery(400, sectorCodigos);

  const { graphNodes, graphEdges, hiddenCounts, nodeCount, edgeCount } = useMemo(() => {
    if (!data) return { graphNodes: [], graphEdges: [], hiddenCounts: {}, nodeCount: 0, edgeCount: 0 };
    const galaxy = buildGalaxy(data);
    return {
      graphNodes: galaxy.nodes,
      graphEdges: galaxy.edges,
      hiddenCounts: galaxy.hiddenCounts,
      nodeCount: data.total_nodes,
      edgeCount: data.total_edges,
    };
  }, [data]);

  if (isLoading) {
    return <Skeleton className="w-full h-full rounded-lg" />;
  }

  if (isError) {
    // TODO: usar <Alert variant="destructive"> cuando exista en @/components/ui/alert
    return (
      <div className={cn('overflow-hidden rounded-lg border border-destructive/50', className)} style={{ height }}>
        <Card className="h-full border-0">
          <CardContent className="flex flex-col items-center justify-center gap-3 h-full py-8">
            <p className="text-sm font-medium text-destructive">Error al cargar el grafo de conocimiento</p>
            <p className="text-sm text-muted-foreground">El servidor no responde.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Reintentar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden rounded-lg', className)} style={{ height }}>
      {graphNodes.length === 0 ? (
        <div className="flex items-center justify-center h-full bg-muted/30 text-sm text-muted-foreground">
          El grafo de conocimiento está vacío.
        </div>
      ) : (
        <ForceGraph2D
          nodes={graphNodes}
          edges={graphEdges}
          hiddenCounts={hiddenCounts}
          onNodeClick={() => navigate('/graph')}
          onExpandNode={() => navigate('/graph')}
        />
      )}

      <div className="absolute top-4 left-4 z-20">
        <div className="inline-flex items-center gap-2 bg-[rgba(10,37,64,0.85)] backdrop-blur-[8px] px-3 py-2 rounded-md border border-white/10">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-white/90">
            Grafo activo · {nodeCount} nodos · {edgeCount} relaciones
          </span>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-20">
        <div className="flex flex-col gap-1.5 bg-[rgba(10,37,64,0.85)] backdrop-blur-[8px] px-3 py-2.5 rounded-md border border-white/10">
          {legendItems.map((item) => (
            <div key={item.type} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: nodeTypeHex[item.type] }}
              />
              <span className="text-[11px] text-white/70">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
