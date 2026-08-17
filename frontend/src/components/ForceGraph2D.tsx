import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { nodeTypeSpanish } from '@/lib/graphNav';
import { graphNodePalette, DEFAULT_NODE_PALETTE } from '@/lib/graph-colors';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

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
  expandedIds?: Set<string>;
  hideCenter?: boolean;
  layoutMode?: 'solar' | 'scatter';
  onNodeClick?: (node: ForceGraphNode | null) => void;
  onExpandNode?: (nodeId: string) => void;
  showEdgeLabels?: boolean;
  className?: string;
}

interface NodePos {
  x: number;
  y: number;
}

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
  FOLLOWS: 'sigue a',
};

function edgeLabel(type: string): string {
  return EDGE_TYPE_SPANISH[type] ?? type.toLowerCase().replace(/_/g, ' ');
}

function colorFor(type: string) {
  return graphNodePalette[type] || DEFAULT_NODE_PALETTE;
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

function orderRingByConnectivity(ids: string[], adj: Map<string, string[]>): string[] {
  const remaining = new Set(ids);
  const order: string[] = [];
  const degree = (id: string) => (adj.get(id) ?? []).filter((nb) => remaining.has(nb)).length;
  while (remaining.size > 0) {
    let pick: string | null = null;
    if (order.length > 0) {
      const last = order[order.length - 1];
      const neighbors = (adj.get(last) ?? []).filter((nb) => remaining.has(nb));
      if (neighbors.length > 0) {
        pick = neighbors.reduce((a, b) => (degree(a) > degree(b) ? a : b));
      }
    }
    if (pick === null) {
      let best = -1;
      for (const id of remaining) {
        const d = degree(id);
        if (d > best) {
          best = d;
          pick = id;
        }
      }
    }
    if (pick === null) break;
    order.push(pick);
    remaining.delete(pick);
  }
  return order;
}

const CURVE_SAMPLES = 12;

interface CurvePoint {
  x: number;
  y: number;
}

function edgeControlPoint(src: NodePos, tgt: NodePos, curvature: number): CurvePoint {
  const dx = tgt.x - src.x;
  const dy = tgt.y - src.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const midX = (src.x + tgt.x) / 2;
  const midY = (src.y + tgt.y) / 2;
  const nx = -dy / dist;
  const ny = dx / dist;
  return { x: midX + nx * curvature, y: midY + ny * curvature };
}

function distanceToCurve(
  px: number,
  py: number,
  src: CurvePoint,
  ctrl: CurvePoint,
  tgt: CurvePoint,
): { dist: number; cx: number; cy: number } {
  const pts: CurvePoint[] = [];
  for (let s = 0; s <= CURVE_SAMPLES; s++) {
    const t = s / CURVE_SAMPLES;
    const mt = 1 - t;
    pts.push({
      x: mt * mt * src.x + 2 * mt * t * ctrl.x + t * t * tgt.x,
      y: mt * mt * src.y + 2 * mt * t * ctrl.y + t * t * tgt.y,
    });
  }
  let best = Infinity;
  let bx = 0;
  let by = 0;
  for (let s = 0; s < pts.length - 1; s++) {
    const a = pts[s];
    const b = pts[s + 1];
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const len2 = abx * abx + aby * aby;
    let t = len2 > 1e-9 ? ((px - a.x) * abx + (py - a.y) * aby) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    const cx = a.x + t * abx;
    const cy = a.y + t * aby;
    const dx = px - cx;
    const dy = py - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < best) {
      best = d2;
      bx = cx;
      by = cy;
    }
  }
  return { dist: Math.sqrt(best), cx: bx, cy: by };
}

function computeEdgeCurvatures(edges: ForceGraphEdge[]): number[] {
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
}

function relaxPositions(
  nodes: ForceGraphNode[],
  edges: ForceGraphEdge[],
  positions: NodePos[],
  ringRadiusFor: number[],
): NodePos[] {
  const cx0 = 70;
  const cy0 = 70;
  const pos = positions.map((p) => ({ x: p.x, y: p.y }));
  const edgeCurvatures = computeEdgeCurvatures(edges);
  const sampleEdge = (e: ForceGraphEdge, idx: number): { src: NodePos; ctrl: CurvePoint; tgt: NodePos } | null => {
    const si = nodes.findIndex((n) => n.id === e.source);
    const ti = nodes.findIndex((n) => n.id === e.target);
    if (si < 0 || ti < 0) return null;
    const src = pos[si];
    const tgt = pos[ti];
    const dx = tgt.x - src.x;
    const dy = tgt.y - src.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const ax = tgt.x - (dx / dist) * 5;
    const ay = tgt.y - (dy / dist) * 5;
    const curvature = edgeCurvatures[idx] ?? 0;
    const ctrl = edgeControlPoint(src, { x: ax, y: ay }, curvature);
    return { src, ctrl, tgt: { x: ax, y: ay } };
  };
  const activeEdges = edges.filter((e) => e.source !== undefined && e.target !== undefined);
  const edgesSamples = activeEdges.map((e, i) => sampleEdge(e, i));
  for (let iter = 0; iter < 600; iter++) {
    for (let s = 0; s < edgesSamples.length; s++) edgesSamples[s] = sampleEdge(activeEdges[s], s);
    for (let i = 0; i < pos.length; i++) {
      for (let j = i + 1; j < pos.length; j++) {
        const dx = pos[j].x - pos[i].x;
        const dy = pos[j].y - pos[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = 5.5 * 2 + 9;
        if (dist > 0 && dist < minDist) {
          const push = ((minDist - dist) / minDist) * 2;
          const nx = dx / dist;
          const ny = dy / dist;
          pos[i].x -= nx * push;
          pos[i].y -= ny * push;
          pos[j].x += nx * push;
          pos[j].y += ny * push;
        }
      }
    }
    for (let i = 0; i < pos.length; i++) {
      const pi = pos[i];
      const nid = nodes[i].id;
      for (let k = 0; k < edgesSamples.length; k++) {
        const sample = edgesSamples[k];
        if (!sample) continue;
        if (activeEdges[k].source === nid || activeEdges[k].target === nid) continue;
        const near = distanceToCurve(pi.x, pi.y, sample.src, sample.ctrl, sample.tgt);
        const minDist = 5.5 + 9;
        if (near.dist > 0 && near.dist < minDist) {
          const dx = pi.x - near.cx;
          const dy = pi.y - near.cy;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          const push = ((minDist - near.dist) / minDist) * 4;
          pi.x += (dx / d) * push;
          pi.y += (dy / d) * push;
        }
      }
    }
    for (let i = 0; i < pos.length; i++) {
      const target = ringRadiusFor[i];
      if (target === undefined) continue;
      const dx = pos[i].x - cx0;
      const dy = pos[i].y - cy0;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const pull = (target - d) * 0.02;
      pos[i].x += (dx / d) * pull;
      pos[i].y += (dy / d) * pull;
    }
  }
  return pos;
}

interface SolarLayoutResult {
  positions: NodePos[];
  rings: number[];
}

function computeScatterLayout(nodes: ForceGraphNode[]): SolarLayoutResult {
  if (nodes.length === 0) return { positions: [], rings: [] };
  const cx = 50;
  const cy = 50;
  if (nodes.length === 1) {
    return { positions: [{ x: cx, y: cy }], rings: [] };
  }
  const radius = Math.max(18, nodes.length * 4.5);
  const positions: NodePos[] = nodes.map((_, i) => {
    const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });
  return { positions, rings: [radius] };
}

function computeSolarLayout(
  nodes: ForceGraphNode[],
  edges: ForceGraphEdge[],
  centerId: string | null | undefined,
  layoutMode: 'solar' | 'scatter' = 'solar',
): SolarLayoutResult {
  if (layoutMode === 'scatter') return computeScatterLayout(nodes);
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
    const R0 = 28;
    const Rstep = 20;
    const sorted = [...byDepth.entries()].sort((a, b) => a[0] - b[0]);
    for (const [d, ids] of sorted) {
      const radius = R0 + d * Rstep;
      rings.push(radius);
      const interleaved = orderRingByConnectivity(ids, adj);
      placeRing(interleaved, radius, 70, 70);
    }
  } else {
    const sectorIds = nodes.filter((n) => n.nodeType === 'IndustrialSector').map((n) => n.id);
    const orphans = nodes.filter((n) => n.nodeType !== 'IndustrialSector').map((n) => n.id);

    const R = Math.min(42, 14 + (sectorIds.length + (orphans.length > 0 ? 1 : 0)) * 3.2);
    rings.push(R);
    if (sectorIds.length > 0) {
      sectorIds.forEach((id, ci) => {
        const angle = (2 * Math.PI * ci) / sectorIds.length - Math.PI / 2;
        const idx = indexOf.get(id);
        if (idx === undefined) return;
        positions[idx] = { x: 70 + R * Math.cos(angle), y: 70 + R * Math.sin(angle) };
      });
    }
    if (orphans.length > 0) {
      const orphanRadius = Math.max(60, 20 + orphans.length * 6);
      const orphanStartAngle = sectorIds.length > 0
        ? (2 * Math.PI * sectorIds.length) / sectorIds.length - Math.PI / 2 + Math.PI / sectorIds.length
        : -Math.PI / 2;
      placeRing(orphans, orphanRadius, 70, 70, orphanStartAngle);
      rings.push(orphanRadius);
    }
  }

  for (let i = 0; i < nodes.length; i++) {
    if (!positions[i]) positions[i] = { x: 70 + (i - nodes.length / 2) * 6, y: 70 };
  }

  if (centerId && indexOf.has(centerId)) {
    const ringRadiusFor = positions.map((p) => Math.sqrt((p.x - 70) ** 2 + (p.y - 70) ** 2));
    const relaxed = relaxPositions(nodes, edges, positions, ringRadiusFor);
    for (let i = 0; i < positions.length; i++) positions[i] = relaxed[i];
  }

  return { positions, rings };
}

export default function ForceGraph2D({
  nodes,
  edges,
  centerId,
  expandedIds,
  hideCenter = false,
  layoutMode,
  onNodeClick,
  onExpandNode,
  showEdgeLabels = false,
  className,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const isScatter = layoutMode === 'scatter';
  const initialLayout = useMemo(() => computeSolarLayout(nodes, edges, centerId, layoutMode), [nodes, edges, centerId, layoutMode]);
  const [positions, setPositions] = useState<NodePos[]>(initialLayout.positions);
  const [dragging, setDragging] = useState<{ index: number; offsetX: number; offsetY: number } | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const nodeRefs = useRef<(SVGGElement | null)[]>([]);

  const layoutCenter = useMemo(() => {
    const pts = initialLayout.positions;
    if (pts.length === 0) return { x: 70, y: 70 };
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
    (k: number) => ({ x: 70 - layoutCenter.x * k, y: 70 - layoutCenter.y * k, k }),
    [layoutCenter],
  );

  const initialView = centeredView(isScatter ? 2.0 : 1.4);
  const vb = isScatter ? { x: -60, y: -60, w: 220, h: 220 } : { x: -50, y: -50, w: 200, h: 200 };
  const viewBox = `${vb.x} ${vb.y} ${vb.w} ${vb.h}`;
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

  const zoomBy = useCallback((factor: number) => {
    setView((v) => {
      const k = Math.min(6, Math.max(0.3, v.k * factor));
      return { ...v, k };
    });
  }, []);

  const resetView = useCallback(() => setView(centeredView(isScatter ? 2.0 : 1.4)), [centeredView, isScatter]);

  const moveNodeFocus = useCallback(
    (dx: number, dy: number) => {
      if (positions.length === 0) return;
      const base = focusedIndex !== null && positions[focusedIndex] ? focusedIndex : -1;
      const cur = base >= 0 ? positions[base] : null;
      let best = -1;
      let bestScore = Number.NEGATIVE_INFINITY;
      positions.forEach((p, i) => {
        if (i === base) return;
        const vx = p.x - (cur?.x ?? 0);
        const vy = p.y - (cur?.y ?? 0);
        const dist = Math.hypot(vx, vy) || 1;
        const dot = (vx * dx + vy * dy) / dist;
        const score = dot + (dot > 0 ? 1000 : 0) - dist * 0.001;
        if (score > bestScore) {
          bestScore = score;
          best = i;
        }
      });
      if (best < 0) return;
      setFocusedIndex(best);
      nodeRefs.current[best]?.focus();
    },
    [positions, focusedIndex],
  );

  const handleContainerKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.shiftKey && e.key.startsWith('Arrow')) {
      e.preventDefault();
      const step = 20;
      const deltas: Record<string, [number, number]> = {
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
      };
      const [dx, dy] = deltas[e.key];
      setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
      return;
    }
    if (e.key === 'Escape') {
      setFocusedIndex(null);
      (document.activeElement as HTMLElement | null)?.blur?.();
    }
  }, []);

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

  const nodeIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    nodes.forEach((n, i) => map.set(n.id, i));
    return map;
  }, [nodes]);

  useEffect(() => {
    setPositions(initialLayout.positions);
    setView(centeredView(1.0));
  }, [initialLayout, centeredView]);

  const centerIndex = centerId != null ? (nodeIndexMap.get(centerId) ?? -1) : -1;

  return (
    <div
      className={cn('w-full h-full rounded-lg overflow-hidden relative', className)}
      style={{ background: 'radial-gradient(ellipse at 50% 40%, #1e293b 0%, #0f172a 70%)' }}
      onKeyDown={handleContainerKeyDown}
    >
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1">
        <button
          type="button"
          onClick={() => zoomBy(1.25)}
          aria-label="Acercar"
          title="Acercar (zoom +)"
          className="w-8 h-8 rounded-md bg-[rgba(10,37,64,0.85)] border border-white/10 text-white/80 hover:text-white flex items-center justify-center"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => zoomBy(0.8)}
          aria-label="Alejar"
          title="Alejar (zoom -)"
          className="w-8 h-8 rounded-md bg-[rgba(10,37,64,0.85)] border border-white/10 text-white/80 hover:text-white flex items-center justify-center"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={resetView}
          aria-label="Restablecer vista"
          title="Restablecer vista"
          className="w-8 h-8 rounded-md bg-[rgba(10,37,64,0.85)] border border-white/10 text-white/80 hover:text-white flex items-center justify-center"
        >
          <Maximize className="h-4 w-4" />
        </button>
      </div>
      <svg
        ref={svgRef}
        viewBox={viewBox}
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
          x={vb.x}
          y={vb.y}
          width={vb.w}
          height={vb.h}
          fill="transparent"
          style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
          onMouseDown={handleBackgroundMouseDown}
          onClick={() => { if (!draggedRef.current) onNodeClick?.(null); }}
        />

        <g transform={`translate(${view.x}, ${view.y}) scale(${view.k})`}>
        {initialLayout.rings.map((r, i) => (
          <circle
            key={`ring-${i}`}
            cx={70}
            cy={70}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="0.25"
            strokeDasharray="1.5 2"
          />
        ))}

        {edges.map((e, i) => {
          const si = nodeIndexMap.get(e.source);
          const ti = nodeIndexMap.get(e.target);
          if (si === undefined || ti === undefined || !positions[si] || !positions[ti]) return null;
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
            <g key={`edge-${e.source}-${e.target}-${i}`}>
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
          const r = isCenter ? 9 : isDragging ? 7 : 5.5;
          const isExpanded = expandedIds?.has(n.id) ?? false;

          return (
            <g
              key={n.id}
              ref={(el) => { nodeRefs.current[i] = el; }}
              onMouseDown={(e) => handleMouseDown(i, e)}
              onClick={(e) => { e.stopPropagation(); handleNodeClick(n); }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setFocusedIndex(i)}
              onKeyDown={(e) => {
                if (e.shiftKey) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleNodeClick(n);
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  moveNodeFocus(0, -1);
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  moveNodeFocus(0, 1);
                } else if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  moveNodeFocus(-1, 0);
                } else if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  moveNodeFocus(1, 0);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`${n.label}${n.subtitle ? `, ${n.subtitle}` : ''} — ${nodeTypeSpanish(n.nodeType)}`}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              className="transition-transform duration-150 focus:outline-none"
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

              {focusedIndex === i && (
                <circle cx={0} cy={0} r={r + 4} fill="none" stroke="#ffffff" strokeWidth="0.7" opacity="0.9" />
              )}

              {isExpanded && !isCenter && (
                <circle cx={0} cy={0} r={r + 3} fill="none" stroke={c.node} strokeWidth="0.35" opacity="0.8" strokeDasharray="2 1.5" />
              )}

              {isDragging && (
                <circle cx={0} cy={0} r={r + 3} fill="none" stroke="#ffffff" strokeWidth="0.3" opacity="0.5" strokeDasharray="2 1.5" />
              )}

              {(() => {
                const labelBelow = pos.y <= layoutCenter.y;
                const labelY = labelBelow ? r + 4 : -(r + 4);
                const subY = labelBelow ? r + 8.2 : -(r + 8.2);
                return (
                  <>
                    <text
                      x={0} y={labelY}
                      textAnchor="middle"
                      fill={c.label}
                      fontSize="4"
                      fontWeight="600"
                      className="pointer-events-none select-none"
                    >
                      {n.label.split('(')[0].trim()}
                    </text>
                    <text
                      x={0} y={subY}
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.45)"
                      fontSize="2.8"
                      className="pointer-events-none select-none"
                    >
                      {n.subtitle || nodeTypeSpanish(n.nodeType)}
                    </text>
                  </>
                );
              })()}
            </g>
          );
        })}
        </g>
      </svg>
    </div>
  );
}

export { ForceGraph2D };
