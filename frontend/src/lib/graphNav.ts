import type { GraphQueryEdge, GraphQueryNode, GraphQueryResponse } from '@/types';
import type { ForceGraphEdge, ForceGraphNode } from '@/components/ForceGraph2D';

export const NODE_TYPE_PRIORITY = [
  'Technology',
  'Organization',
  'Patent',
  'Regulation',
  'Person',
  'Indicator',
  'IndustrialSector',
  'Cluster',
];

export function primaryType(labels: string[]): string {
  return NODE_TYPE_PRIORITY.find((t) => labels.includes(t)) ?? (labels[0] ?? 'Unknown');
}

export const NODE_TYPE_SPANISH: Record<string, string> = {
  Technology: 'Tecnología',
  Organization: 'Organización',
  Patent: 'Patente',
  Regulation: 'Regulación',
  Person: 'Persona',
  Indicator: 'Indicador',
  IndustrialSector: 'Sector',
  Cluster: 'Agrupación',
};

export function nodeTypeSpanish(type: string): string {
  return NODE_TYPE_SPANISH[type] ?? type;
}

export function nodeLabel(props: Record<string, unknown>): string {
  const name =
    props.nombre || props.name || props.titulo || props.title || props.patent_number || props.codigo || props.id || 'Nodo';
  return String(name).split('(')[0].trim();
}

export function toForceNode(n: GraphQueryNode): ForceGraphNode {
  return { id: n.id, label: nodeLabel(n.props), nodeType: primaryType(n.labels) };
}

function buildAdjacency(
  nodes: GraphQueryNode[],
  edges: GraphQueryEdge[],
): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  for (const n of nodes) adj.set(n.id, new Set());
  for (const e of edges) {
    if (!adj.has(e.source) || !adj.has(e.target)) continue;
    adj.get(e.source)!.add(e.target);
    adj.get(e.target)!.add(e.source);
  }
  return adj;
}

export interface GalaxyBuildResult {
  nodes: ForceGraphNode[];
  edges: ForceGraphEdge[];
}

export function buildGalaxy(graph: GraphQueryResponse): GalaxyBuildResult {
  const nodes: ForceGraphNode[] = [];

  for (const n of graph.nodes) {
    if (!n.labels.includes('IndustrialSector')) continue;
    nodes.push(toForceNode(n));
  }

  return { nodes, edges: [] };
}

export interface SystemBuildResult {
  nodes: ForceGraphNode[];
  edges: ForceGraphEdge[];
  centerId: string;
}

export function buildSystem(
  graph: GraphQueryResponse,
  centerId: string,
  expanded: Set<string>,
): SystemBuildResult {
  const adj = buildAdjacency(graph.nodes, graph.edges);
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const visible = new Set<string>([centerId]);
  const edges: ForceGraphEdge[] = [];

  const queue = [centerId];
  while (queue.length) {
    const id = queue.shift()!;
    const isOpen = id === centerId || expanded.has(id);
    if (!isOpen) continue;
    for (const nb of adj.get(id) ?? []) {
      if (!visible.has(nb)) {
        visible.add(nb);
        queue.push(nb);
      }
    }
  }

  for (const e of graph.edges) {
    if (visible.has(e.source) && visible.has(e.target)) {
      edges.push({ source: e.source, target: e.target, type: e.type });
    }
  }

  const nodes: ForceGraphNode[] = [];
  for (const id of visible) {
    const raw = nodeMap.get(id);
    if (raw) nodes.push(toForceNode(raw));
  }

  return { nodes, edges, centerId };
}
