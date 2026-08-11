import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { nodeTypeSpanish } from '@/lib/graphNav';

export interface ForceGraphNode {
  id: string;
  label: string;
  nodeType: string;
  subtitle?: string;
}

export interface ForceGraphEdge {
  source: string;
  target: string;
  type?: string;
}

interface Props {
  nodes: ForceGraphNode[];
  edges: ForceGraphEdge[];
  centerId?: string | null;
  hiddenCounts?: Record<string, number>;
  expandedIds?: Set<string>;
  hideCenter?: boolean;
  onNodeClick?: (node: ForceGraphNode | null) => void;
  onExpandNode?: (nodeId: string) => void;
  showEdgeLabels?: boolean;
  className?: string;
}

interface NodePos {
  x: number;
  y: number;
}

const NODE_TYPE_COLORS: Record<string, { node: string; edge: string; label: string }> = {
  Technology: { node: '#3b82f6', edge: 'rgba(59,130,246,0.7)', label: 'rgb(147, 197, 253)' },
  Organization: { node: '#10b981', edge: 'rgba(16,185,129,0.7)', label: 'rgb(110, 231, 183)' },
  Patent: { node: '#f97316', edge: 'rgba(249,115,22,0.7)', label: 'rgb(251, 191, 143)' },
  Regulation: { node: '#ef4444', edge: 'rgba(239,68,68,0.7)', label: 'rgb(252, 165, 165)' },
  Person: { node: '#eab308', edge: 'rgba(234,179,8,0.7)', label: 'rgb(252, 211, 77)' },
  Indicator: { node: '#a855f7', edge: 'rgba(168,85,247,0.7)', label: 'rgb(216, 180, 254)' },
  IndustrialSector: { node: '#64748b', edge: 'rgba(100,116,139,0.7)', label: 'rgb(148, 163, 184)' },
  Cluster: { node: '#06b6d4', edge: 'rgba(6,182,212,0.7)', label: 'rgb(103, 232, 249)' },
};

const DEFAULT_COLOR = { node: '#06b6d4', edge: 'rgba(6,182,212,0.7)', label: 'rgb(103, 232, 249)' };

const EDGE_TYPE_SPANISH: Record<string, string> = {
  BELONGS_TO_SECTOR: 'pertenece al sector',
  OPERATES_IN: 'opera en',
  MEASURES: 'mide',
  IS_AUTHOR_OF: 'es autor de',
  IS_AUTHOR: 'es autor de',
  IS_MEMBER_OF: 'es miembro de',
  WORKS_AT: 'trabaja en',
  CITES: 'cita',
  RELATES_TO: 'relacionado con',
  PART_OF: 'parte de',
  HAS_TECHNOLOGY: 'tiene tecnología',
  HAS_PATENT: 'tiene patente',
};

function edgeLabel(type: string): string {
  return EDGE_TYPE_SPANISH[type] ?? type.toLowerCase().replace(/_/g, ' ');
}

function colorFor(type: string) {
  return NODE_TYPE_COLORS[type] || DEFAULT_COLOR;
}

function buildAdjacency(nodes: ForceGraphNode[], edges: ForceGraphEdge[]): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const n of nodes) adj.set(n.id, []);
  for (const e of edges) {
    if (!adj.has(e.source) || !adj.has(e.target)) continue;
    adj.get(e.source)!.push(e.target);
    adj.get(e.target)!.push(e.source);
  }
  return adj;
}

function groupByDepth(centerId: string, adj: Map<string, string[]>): Map<number, string[]> {
  const depthMap = new Map<string, number>();
  depthMap.set(centerId, 0);
  const queue = [centerId];
  while (queue.length) {
    const id = queue.shift()!;
    const d = depthMap.get(id)!;
    for (const nb of adj.get(id) ?? []) {
      if (!depthMap.has(nb)) {
        depthMap.set(nb, d + 1);
        queue.push(nb);
      }
    }
  }
  const byDepth = new Map<number, string[]>();
  for (const [id, d] of depthMap) {
    if (!byDepth.has(d)) byDepth.set(d, []);
    byDepth.get(d)!.push(id);
  }
  return byDepth;
}

interface SolarLayoutResult {
  positions: NodePos[];
  rings: number[];
}

function computeSolarLayout(
  nodes: ForceGraphNode[],
  edges: ForceGraphEdge[],
  centerId: string | null | undefined,
): SolarLayoutResult {
  if (nodes.length === 0) return { positions: [], rings: [] };

  const adj = buildAdjacency(nodes, edges);
  const indexOf = new Map(nodes.map((n, i) => [n.id, i]));
  const positions: NodePos[] = new Array(nodes.length);
  const rings: number[] = [];

  const placeRing = (
    ids: string[],
    radius: number,
    cx: number,
    cy: number,
    startAngle = -Math.PI / 2,
  ) => {
    ids.forEach((id, k) => {
      const angle = (2 * Math.PI * k) / Math.max(ids.length, 1) + startAngle;
      const idx = indexOf.get(id);
      if (idx === undefined) return;
      positions[idx] = { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
    });
  };

  if (centerId && indexOf.has(centerId)) {
    const byDepth = groupByDepth(centerId, adj);
    const R0 = 32;
    const Rstep = 28;
    const sorted = [...byDepth.entries()].sort((a, b) => a[0] - b[0]);
    for (const [d, ids] of sorted) {
      const radius = R0 + d * Rstep;
      rings.push(radius);
      placeRing(ids, radius, 50, 50);
    }
  } else {
    const sectorIds = nodes.filter((n) => n.nodeType === 'IndustrialSector').map((n) => n.id);
    const orphans = nodes.filter((n) => n.nodeType !== 'IndustrialSector').map((n) => n.id);

    if (sectorIds.length > 0) {
      const R = Math.min(48, 18 + sectorIds.length * 4.5);
      rings.push(R);
      sectorIds.forEach((id, ci) => {
        const angle = (2 * Math.PI * ci) / sectorIds.length - Math.PI / 2;
        const idx = indexOf.get(id);
        if (idx === undefined) return;
        positions[idx] = { x: 50 + R * Math.cos(angle), y: 50 + R * Math.sin(angle) };
      });
    }
    if (orphans.length > 0) {
      const R = Math.min(55, 22 + orphans.length * 5);
      rings.push(R);
      placeRing(orphans, R, 50, 50);
    }
  }

  for (let i = 0; i < nodes.length; i++) {
    if (!positions[i]) positions[i] = { x: 50 + (i - nodes.length / 2) * 6, y: 50 };
  }

  return { positions, rings };
}

export default function ForceGraph2D({
  nodes,
  edges,
  centerId,
  hiddenCounts = {},
  expandedIds,
  hideCenter = false,
  onNodeClick,
  onExpandNode,
  showEdgeLabels = false,
  className,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const initialLayout = useMemo(() => computeSolarLayout(nodes, edges, centerId), [nodes, edges, centerId]);
  const [positions, setPositions] = useState<NodePos[]>(initialLayout.positions);
  const [dragging, setDragging] = useState<{ index: number; offsetX: number; offsetY: number } | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  const layoutCenter = useMemo(() => {
    const pts = initialLayout.positions;
    if (pts.length === 0) return { x: 50, y: 50 };
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  }, [initialLayout.positions]);

  const centeredView = useCallback(
    (k: number) => ({ x: 50 - layoutCenter.x * k, y: 50 - layoutCenter.y * k, k }),
    [layoutCenter],
  );

  const initialView = centeredView(1.2);
  const [view, setView] = useState(initialView);
  const viewRef = useRef(view);
  viewRef.current = view;
  const [isPanning, setIsPanning] = useState(false);
  const panningRef = useRef<{ startX: number; startY: number; viewX: number; viewY: number } | null>(null);
  const draggedRef = useRef(false);
  const clickTimerRef = useRef<number | null>(null);

  const screenToSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const viewBox = svg.viewBox.baseVal;
    const v = viewRef.current;
    const sx = (clientX - rect.left) / rect.width;
    const sy = (clientY - rect.top) / rect.height;
    return {
      x: (sx * viewBox.width - v.x) / v.k + viewBox.x,
      y: (sy * viewBox.height - v.y) / v.k + viewBox.y,
    };
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const v = viewRef.current;
    const factor = Math.exp(-e.deltaY * 0.0015);
    const k = Math.min(6, Math.max(0.3, v.k * factor));
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const sx = mx / rect.width;
    const sy = my / rect.height;
    const viewBox = svg.viewBox.baseVal;
    const wx = (sx * viewBox.width - v.x) / v.k + viewBox.x;
    const wy = (sy * viewBox.height - v.y) / v.k + viewBox.y;
    setView({ x: sx * viewBox.width - (wx - viewBox.x) * k, y: sy * viewBox.height - (wy - viewBox.y) * k, k });
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleBackgroundMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    panningRef.current = { startX: e.clientX, startY: e.clientY, viewX: viewRef.current.x, viewY: viewRef.current.y };
    draggedRef.current = false;
    setIsPanning(true);
  }, []);

  const handleMouseDown = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const svgPt = screenToSvg(e.clientX, e.clientY);
    const pos = positions[index];
    if (!pos) return;
    draggedRef.current = false;
    setDragging({ index, offsetX: svgPt.x - pos.x, offsetY: svgPt.y - pos.y });
  }, [positions, screenToSvg]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging) {
      draggedRef.current = true;
      const svgPt = screenToSvg(e.clientX, e.clientY);
      setPositions((prev) => {
        const next = [...prev];
        next[dragging.index] = {
          x: svgPt.x - dragging.offsetX,
          y: svgPt.y - dragging.offsetY,
        };
        return next;
      });
      return;
    }
    const panning = panningRef.current;
    if (panning) {
      draggedRef.current = true;
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const viewBox = svgRef.current!.viewBox.baseVal;
      const v = viewRef.current;
      const dx = ((e.clientX - panning.startX) / rect.width) * viewBox.width;
      const dy = ((e.clientY - panning.startY) / rect.height) * viewBox.height;
      setView({ ...v, x: panning.viewX + dx, y: panning.viewY + dy });
    }
  }, [dragging, screenToSvg]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    panningRef.current = null;
    setIsPanning(false);
  }, []);

  const handleNodeClick = useCallback((node: ForceGraphNode) => {
    if (draggedRef.current) return;
    if (clickTimerRef.current !== null) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      onExpandNode?.(node.id);
      return;
    }
    clickTimerRef.current = window.setTimeout(() => {
      clickTimerRef.current = null;
      onNodeClick?.(node);
    }, 250);
  }, [onNodeClick, onExpandNode]);

  const edgeCurvatures = useMemo(() => {
    const curv = new Array<number>(edges.length).fill(0);
    const inGroups = new Map<string, number[]>();
    const outGroups = new Map<string, number[]>();
    edges.forEach((e, i) => {
      if (!inGroups.has(e.target)) inGroups.set(e.target, []);
      inGroups.get(e.target)!.push(i);
      if (!outGroups.has(e.source)) outGroups.set(e.source, []);
      outGroups.get(e.source)!.push(i);
    });
    const SPACING = 1.7;
    const spread = (idxs: number[]) => {
      idxs.forEach((idx, k) => {
        curv[idx] += (k - (idxs.length - 1) / 2) * SPACING;
      });
    };
    inGroups.forEach(spread);
    outGroups.forEach(spread);
    return curv;
  }, [edges]);

  useEffect(() => {
    return () => {
      if (clickTimerRef.current !== null) window.clearTimeout(clickTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setPositions(initialLayout.positions);
    setView(centeredView(1.5));
  }, [initialLayout, centeredView]);

  const centerIndex = centerId ? nodes.findIndex((n) => n.id === centerId) : -1;

  return (
    <div
      className={cn('w-full h-full rounded-lg overflow-hidden relative', className)}
      style={{ background: 'radial-gradient(ellipse at 50% 40%, #1e293b 0%, #0f172a 70%)' }}
    >
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
      <svg
        ref={svgRef}
        viewBox="-80 -80 260 260"
        className="w-full h-full select-none relative z-10"
        preserveAspectRatio="xMidYMid meet"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { handleMouseUp(); setHovered(null); }}
      >
        <defs>
          <marker id="eg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255,255,255,0.25)" />
          </marker>
        </defs>

        <rect
          x="-80"
          y="-80"
          width="260"
          height="260"
          fill="transparent"
          style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
          onMouseDown={handleBackgroundMouseDown}
          onClick={() => { if (!draggedRef.current) onNodeClick?.(null); }}
        />

        <g transform={`translate(${view.x}, ${view.y}) scale(${view.k})`}>
        {initialLayout.rings.map((r, i) => (
          <circle
            key={`ring-${i}`}
            cx={50}
            cy={50}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="0.25"
            strokeDasharray="1.5 2"
          />
        ))}

        {edges.map((e, i) => {
          const si = nodes.findIndex((n) => n.id === e.source);
          const ti = nodes.findIndex((n) => n.id === e.target);
          if (si < 0 || ti < 0 || !positions[si] || !positions[ti]) return null;
          if (hideCenter && (e.source === centerId || e.target === centerId)) return null;
          const src = positions[si];
          const tgt = positions[ti];
          const dx = tgt.x - src.x;
          const dy = tgt.y - src.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const arrowSize = 2.4;
          const ax = tgt.x - (dx / dist) * 5;
          const ay = tgt.y - (dy / dist) * 5;
          const nx = -dy / dist;
          const ny = dx / dist;
          const curvature = edgeCurvatures[i] ?? 0;
          const ctrlX = (src.x + ax) / 2 + nx * curvature;
          const ctrlY = (src.y + ay) / 2 + ny * curvature;
          const angle = Math.atan2(ay - ctrlY, ax - ctrlX);
          const edgeColor = colorFor(nodes[si].nodeType).edge;
          const isHovered = hovered === si || hovered === ti;
          const midX = 0.25 * src.x + 0.5 * ctrlX + 0.25 * ax;
          const midY = 0.25 * src.y + 0.5 * ctrlY + 0.25 * ay;
          return (
            <g key={`edge-${i}`}>
              <path
                d={`M ${src.x} ${src.y} Q ${ctrlX} ${ctrlY} ${ax} ${ay}`}
                fill="none"
                stroke={edgeColor}
                strokeWidth={isHovered ? 1.1 : 0.75}
                className="transition-all duration-300"
              />
              <polygon
                points={`${ax},${ay} ${ax - arrowSize * Math.cos(angle - 0.45)},${ay - arrowSize * Math.sin(angle - 0.45)} ${ax - arrowSize * Math.cos(angle + 0.45)},${ay - arrowSize * Math.sin(angle + 0.45)}`}
                fill="rgba(255,255,255,0.55)"
              />
              {showEdgeLabels && e.type && (
                <text
                  x={midX} y={midY}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.55)"
                  fontSize="4"
                  className="pointer-events-none select-none"
                  paintOrder="stroke"
                  stroke="#0f172a"
                  strokeWidth="0.4"
                >
                  {edgeLabel(e.type)}
                </text>
              )}
            </g>
          );
        })}

        {nodes.map((n, i) => {
          const pos = positions[i];
          if (!pos) return null;
          if (hideCenter && n.id === centerId) return null;
          const c = colorFor(n.nodeType);
          const radialGradId = `eg-grad-${i}`;
          const isDragging = dragging?.index === i;
          const isHovered = hovered === i;
          const isCenter = i === centerIndex;
          const scale = isDragging ? 1.3 : isHovered ? 1.15 : 1;
          const r = isCenter ? 9 : isDragging ? 8 : 6.5;
          const hidden = hiddenCounts[n.id] ?? 0;
          const isExpanded = expandedIds?.has(n.id) ?? false;

          return (
            <g
              key={n.id}
              onMouseDown={(e) => handleMouseDown(i, e)}
              onClick={(e) => { e.stopPropagation(); handleNodeClick(n); }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              className="transition-transform duration-150"
              transform={`translate(${pos.x}, ${pos.y}) scale(${scale})`}
            >
              <defs>
                <radialGradient id={radialGradId} cx="35%" cy="30%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
                  <stop offset="40%" stopColor={c.node} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={c.node} stopOpacity="1" />
                </radialGradient>
              </defs>

              {isCenter && (
                <circle cx={0} cy={0} r={10.5} fill={c.node} opacity="0.18">
                  <animate attributeName="r" values="9.5;12;9.5" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.22;0.08;0.22" dur="3s" repeatCount="indefinite" />
                </circle>
              )}

              {isHovered && (
                <circle cx={0} cy={0} r={r + 2.5} fill="none" stroke={c.node} strokeWidth="0.4" opacity="0.4">
                  <animate attributeName="r" values={`${r + 2};${r + 4};${r + 2}`} dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
                </circle>
              )}

              <circle
                cx={0} cy={0} r={r}
                fill={`url(#${radialGradId})`}
              />

              {isExpanded && !isCenter && (
                <circle cx={0} cy={0} r={r + 3} fill="none" stroke={c.node} strokeWidth="0.35" opacity="0.8" strokeDasharray="2 1.5" />
              )}

              {isDragging && (
                <circle cx={0} cy={0} r={r + 3} fill="none" stroke="#ffffff" strokeWidth="0.3" opacity="0.5" strokeDasharray="2 1.5" />
              )}

              {hidden > 0 && (
                <g className="pointer-events-none">
                  <circle cx={r * 0.8} cy={-r * 0.8} r={5} fill="#0f172a" stroke={c.node} strokeWidth="0.5" />
                  <text
                    x={r * 0.8} y={-r * 0.8 + 1.7}
                    textAnchor="middle"
                    fill={c.label}
                    fontSize="4.2"
                    fontWeight="700"
                  >
                    {hidden}
                  </text>
                </g>
              )}

              <text
                x={0} y={r + 4}
                textAnchor="middle"
                fill={c.label}
                fontSize="4"
                fontWeight="600"
                className="pointer-events-none select-none"
              >
                {n.label.split('(')[0].trim()}
              </text>
              <text
                x={0} y={r + 8.2}
                textAnchor="middle"
                fill="rgba(255,255,255,0.45)"
                fontSize="2.8"
                className="pointer-events-none select-none"
              >
                {n.subtitle || nodeTypeSpanish(n.nodeType)}
              </text>
            </g>
          );
        })}
        </g>
      </svg>
    </div>
  );
}

export { ForceGraph2D };
