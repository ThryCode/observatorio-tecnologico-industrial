import { useRef, useEffect, useCallback } from 'react';

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface Link {
  source: number;
  target: number;
  type: string;
}

interface ForceGraphProps {
  nodes: { id: string; labels: string[] }[];
  links: { source: string; target: string; type: string }[];
  onNodeClick?: (id: string) => void;
  width?: number;
  height?: number;
}

const LABEL_COLORS: Record<string, string> = {
  Organization: '#f59e0b',
  Technology: '#3b82f6',
  Patent: '#10b981',
  Regulation: '#8b5cf6',
  Indicator: '#ec4899',
  IndustrialSector: '#14b8a6',
  Person: '#f97316',
};

function getColor(labels: string[]): string {
  for (const lbl of labels) {
    if (LABEL_COLORS[lbl]) return LABEL_COLORS[lbl];
  }
  return '#6b7280';
}

export default function ForceGraph2D({ nodes: rawNodes, links: rawLinks, onNodeClick, width = 800, height = 600 }: ForceGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const nodesRef = useRef<Node[]>([]);
  const linksRef = useRef<Link[]>([]);
  const dragRef = useRef<{ index: number; ox: number; oy: number } | null>(null);
  const offsetRef = useRef({ x: width / 2, y: height / 2 });
  const scaleRef = useRef(1);

  // Build graph data
  useEffect(() => {
    const idMap = new Map<string, number>();
    const nodes: Node[] = rawNodes.map((n, i) => {
      idMap.set(n.id, i);
      return {
        id: n.id,
        label: n.labels[0] || 'Node',
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
        radius: n.labels.includes('IndustrialSector') ? 18 : n.labels.includes('Organization') ? 14 : 10,
        color: getColor(n.labels),
      };
    });
    const links: Link[] = rawLinks
      .filter((l) => idMap.has(l.source) && idMap.has(l.target))
      .map((l) => ({ source: idMap.get(l.source)!, target: idMap.get(l.target)!, type: l.type }));
    nodesRef.current = nodes;
    linksRef.current = links;
  }, [rawNodes, rawLinks, width, height]);

  const getNodeAt = useCallback((mx: number, my: number): number | null => {
    const nodes = nodesRef.current;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dx = (n.x + offsetRef.current.x - mx) / scaleRef.current;
      const dy = (n.y + offsetRef.current.y - my) / scaleRef.current;
      if (dx * dx + dy * dy < (n.radius + 5) * (n.radius + 5)) return i;
    }
    return null;
  }, []);

  // Simulation tick
  useEffect(() => {
    let running = true;

    const tick = () => {
      if (!running) return;
      const nodes = nodesRef.current;
      const links = linksRef.current;
      if (nodes.length === 0) { animRef.current = requestAnimationFrame(tick); return; }

      const repulsion = 8000;
      const attraction = 0.005;
      const damping = 0.9;
      const minDist = 30;

      // Forces
      for (let i = 0; i < nodes.length; i++) {
        nodes[i].vx *= damping;
        nodes[i].vy *= damping;

        for (let j = i + 1; j < nodes.length; j++) {
          let dx = nodes[j].x - nodes[i].x;
          let dy = nodes[j].y - nodes[i].y;
          let dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDist) dist = minDist;
          const force = repulsion / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          nodes[i].vx -= fx;
          nodes[i].vy -= fy;
          nodes[j].vx += fx;
          nodes[j].vy += fy;
        }
      }

      for (const link of links) {
        const a = nodes[link.source];
        const b = nodes[link.target];
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 120) * attraction;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }

      // Center gravity
      for (const n of nodes) {
        n.vx += (width / 2 - n.x) * 0.001;
        n.vy += (height / 2 - n.y) * 0.001;
        n.x += n.vx;
        n.y += n.vy;
      }

      // Render
      const canvas = canvasRef.current;
      if (!canvas) { animRef.current = requestAnimationFrame(tick); return; }
      const ctx = canvas.getContext('2d');
      if (!ctx) { animRef.current = requestAnimationFrame(tick); return; }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(offsetRef.current.x, offsetRef.current.y);
      ctx.scale(scaleRef.current, scaleRef.current);

      // Edges
      ctx.strokeStyle = 'rgba(156, 163, 175, 0.4)';
      ctx.lineWidth = 1;
      for (const link of links) {
        const a = nodes[link.source];
        const b = nodes[link.target];
        if (!a || !b) continue;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // Nodes
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(n.label, n.x, n.y + n.radius + 14);
      }

      ctx.restore();

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, [width, height]);

  // Mouse handlers
  const getPos = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { mx: 0, my: 0 };
    return { mx: e.clientX - rect.left, my: e.clientY - rect.top };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const { mx, my } = getPos(e);
    const idx = getNodeAt(mx, my);
    if (idx !== null) {
      const n = nodesRef.current[idx];
      dragRef.current = { index: idx, ox: n.x, oy: n.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragRef.current !== null) {
      const { mx, my } = getPos(e);
      const n = nodesRef.current[dragRef.current.index];
      if (n) {
        n.x = dragRef.current.ox + (mx - offsetRef.current.x) / scaleRef.current;
        n.y = dragRef.current.oy + (my - offsetRef.current.y) / scaleRef.current;
        n.vx = 0;
        n.vy = 0;
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragRef.current !== null) {
      const { mx, my } = getPos(e);
      const idx = getNodeAt(mx, my);
      if (idx === dragRef.current.index && onNodeClick) {
        onNodeClick(nodesRef.current[idx].id);
      }
      dragRef.current = null;
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    scaleRef.current = Math.max(0.2, Math.min(5, scaleRef.current * delta));
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-full cursor-grab active:cursor-grabbing bg-background rounded-lg border"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    />
  );
}