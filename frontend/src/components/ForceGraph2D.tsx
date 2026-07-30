import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import type { EnterpriseGraphNode, EnterpriseGraphEdge } from '@/types';

interface Props {
  nodes: EnterpriseGraphNode[];
  edges: EnterpriseGraphEdge[];
  onNodeClick?: (node: EnterpriseGraphNode | null) => void;
}

interface NodePos {
  x: number;
  y: number;
}

const COLORS = [
  { node: '#6366f1', edge: 'rgba(99,102,241,0.35)', label: 'rgb(165, 167, 247)' },
  { node: '#06b6d4', edge: 'rgba(6,182,212,0.35)', label: 'rgb(103, 232, 249)' },
  { node: '#10b981', edge: 'rgba(16,185,129,0.35)', label: 'rgb(110, 231, 183)' },
  { node: '#f59e0b', edge: 'rgba(245,158,11,0.35)', label: 'rgb(252, 211, 77)' },
  { node: '#f97316', edge: 'rgba(249,115,22,0.35)', label: 'rgb(251, 191, 143)' },
  { node: '#ef4444', edge: 'rgba(239,68,68,0.35)', label: 'rgb(252, 165, 165)' },
  { node: '#ec4899', edge: 'rgba(236,72,153,0.35)', label: 'rgb(244, 189, 212)' },
  { node: '#a855f7', edge: 'rgba(168,85,247,0.35)', label: 'rgb(216, 180, 254)' },
  { node: '#14b8a6', edge: 'rgba(20,184,166,0.35)', label: 'rgb(153, 246, 228)' },
];

function computeLayout(nodes: EnterpriseGraphNode[], edges: EnterpriseGraphEdge[]): NodePos[] {
  const cx = 50;
  const cy = 50;
  const r = 38;

  const positions: NodePos[] = [];
  const connected: number[] = [];
  const orphans: number[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const hasEdge = edges.some((e) => e.source === nodes[i].id || e.target === nodes[i].id);
    if (hasEdge) connected.push(i);
    else orphans.push(i);
  }

  for (let i = 0; i < connected.length; i++) {
    const angle = (2 * Math.PI * i) / connected.length - Math.PI / 2;
    positions[connected[i]] = {
      x: cx + r * 0.7 * Math.cos(angle),
      y: cy + r * 0.7 * Math.sin(angle),
    };
  }

  for (let i = 0; i < orphans.length; i++) {
    const angle = (2 * Math.PI * i) / orphans.length;
    positions[orphans[i]] = {
      x: cx + r * 1.4 * Math.cos(angle),
      y: cy + r * 1.4 * Math.sin(angle),
    };
  }

  return positions;
}

export default function ForceGraph2D({ nodes, edges, onNodeClick }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const initialLayout = useMemo(() => computeLayout(nodes, edges), [nodes, edges]);
  const [positions, setPositions] = useState<NodePos[]>(initialLayout);
  const [dragging, setDragging] = useState<{ index: number; offsetX: number; offsetY: number } | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const draggedRef = useRef(false);

  const screenToSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const viewBox = svg.viewBox.baseVal;
    return {
      x: ((clientX - rect.left) / rect.width) * viewBox.width + viewBox.x,
      y: ((clientY - rect.top) / rect.height) * viewBox.height + viewBox.y,
    };
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
    if (!dragging) return;
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
  }, [dragging, screenToSvg]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    setPositions(computeLayout(nodes, edges));
  }, [nodes, edges]);

  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative" style={{ background: 'radial-gradient(ellipse at 50% 40%, #1e293b 0%, #0f172a 70%)' }}>
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
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

        <rect width="100" height="100" fill="transparent" onClick={() => onNodeClick?.(null)} />

        {edges.map((e, i) => {
          const si = nodes.findIndex((n) => n.id === e.source);
          const ti = nodes.findIndex((n) => n.id === e.target);
          if (si < 0 || ti < 0 || !positions[si] || !positions[ti]) return null;
          const src = positions[si];
          const tgt = positions[ti];
          const dx = tgt.x - src.x;
          const dy = tgt.y - src.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const arrowSize = 1.8;
          const ax = tgt.x - (dx / dist) * 5;
          const ay = tgt.y - (dy / dist) * 5;
          const angle = Math.atan2(dy, dx);
          const edgeColor = COLORS[si % COLORS.length].edge;
          const isHovered = hovered === si || hovered === ti;
          return (
            <g key={`edge-${i}`}>
              <line
                x1={src.x} y1={src.y} x2={ax} y2={ay}
                stroke={edgeColor}
                strokeWidth={isHovered ? 0.7 : 0.45}
                className="transition-all duration-300"
              />
              <polygon
                points={`${ax},${ay} ${ax - arrowSize * Math.cos(angle - 0.45)},${ay - arrowSize * Math.sin(angle - 0.45)} ${ax - arrowSize * Math.cos(angle + 0.45)},${ay - arrowSize * Math.sin(angle + 0.45)}`}
                fill="rgba(255,255,255,0.35)"
              />
            </g>
          );
        })}

        {nodes.map((n, i) => {
          const pos = positions[i];
          if (!pos) return null;
          const c = COLORS[i % COLORS.length];
          const radialGradId = `eg-grad-${i}`;
          const isDragging = dragging?.index === i;
          const isHovered = hovered === i;
          const scale = isDragging ? 1.3 : isHovered ? 1.15 : 1;
          const r = isDragging ? 6 : 4.5;

          return (
            <g
              key={n.id}
              onMouseDown={(e) => handleMouseDown(i, e)}
              onClick={(e) => { if (!draggedRef.current) onNodeClick?.(n); }}
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

              {isDragging && (
                <circle cx={0} cy={0} r={r + 3} fill="none" stroke="#ffffff" strokeWidth="0.3" opacity="0.5" strokeDasharray="2 1.5" />
              )}

              <text
                x={0} y={r + 3.2}
                textAnchor="middle"
                fill={c.label}
                fontSize="2.2"
                fontWeight="600"
                className="pointer-events-none select-none"
              >
                {n.siglas || n.label.split('(')[0].trim()}
              </text>
              <text
                x={0} y={r + 5.5}
                textAnchor="middle"
                fill="rgba(255,255,255,0.35)"
                fontSize="1.4"
                className="pointer-events-none select-none"
              >
                {n.tipo || ''}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export { ForceGraph2D };
