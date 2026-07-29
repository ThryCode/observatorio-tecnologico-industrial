import { useRef, useEffect, useCallback, useState } from 'react';
import type { EnterpriseGraphNode, EnterpriseGraphEdge } from '@/types';

interface ForceNode extends EnterpriseGraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Props {
  nodes: EnterpriseGraphNode[];
  edges: EnterpriseGraphEdge[];
}

const REPULSION = 8000;
const ATTRACTION = 0.005;
const DAMPING = 0.85;
const MIN_VELOCITY = 0.1;
const RADIUS = 24;
const RADIUS_ORG = 32;

export default function ForceGraph2D({ nodes, edges }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<ForceNode[]>([]);
  const animRef = useRef<number>(0);
  const dragRef = useRef<{ node: ForceNode | null; ox: number; oy: number }>({ node: null, ox: 0, oy: 0 });
  const sizeRef = useRef({ width: 800, height: 600 });

  const initSimulation = useCallback(() => {
    const { width, height } = sizeRef.current;
    const sim: ForceNode[] = nodes.map(() => ({
      ...(null as unknown as ForceNode),
      x: width / 2 + (Math.random() - 0.5) * width * 0.5,
      y: height / 2 + (Math.random() - 0.5) * height * 0.5,
      vx: 0,
      vy: 0,
      id: '',
      type: 'person',
      label: '',
    }));
    for (let i = 0; i < nodes.length; i++) {
      sim[i] = { ...nodes[i], ...sim[i] };
    }
    simRef.current = sim;
  }, [nodes]);

  const tick = useCallback(() => {
    const sim = simRef.current;
    const { width, height } = sizeRef.current;
    const cx = width / 2;
    const cy = height / 2;
    const es = edges;

    for (let i = 0; i < sim.length; i++) {
      let fx = 0;
      let fy = 0;

      fx += (cx - sim[i].x) * 0.001;
      fy += (cy - sim[i].y) * 0.001;

      for (let j = 0; j < sim.length; j++) {
        if (i === j) continue;
        const dx = sim[i].x - sim[j].x;
        const dy = sim[i].y - sim[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = REPULSION / (dist * dist);
        fx += (dx / dist) * f;
        fy += (dy / dist) * f;
      }

      for (const e of es) {
        let si = -1;
        let sj = -1;
        for (let k = 0; k < sim.length; k++) {
          if (sim[k].id === e.source) si = k;
          if (sim[k].id === e.target) sj = k;
        }
        if (si < 0 || sj < 0) continue;
        const ni = sim[si];
        const nj = sim[sj];
        const dx = nj.x - ni.x;
        const dy = nj.y - ni.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = ATTRACTION;
        ni.vx += dx * force;
        ni.vy += dy * force;
        nj.vx -= dx * force;
        nj.vy -= dy * force;
      }

      sim[i].vx = (sim[i].vx + fx) * DAMPING;
      sim[i].vy = (sim[i].vy + fy) * DAMPING;
      sim[i].x += sim[i].vx;
      sim[i].y += sim[i].vy;
    }
  }, [edges]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = sizeRef.current;

    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    const sim = simRef.current;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    for (const e of edges) {
      const src = sim.find((n) => n.id === e.source);
      const tgt = sim.find((n) => n.id === e.target);
      if (!src || !tgt) continue;

      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);
      ctx.stroke();

      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const r = tgt.type === 'organization' ? RADIUS_ORG : RADIUS;
      const ax = tgt.x - (dx / dist) * (r + 8);
      const ay = tgt.y - (dy / dist) * (r + 8);
      const angle = Math.atan2(dy, dx);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - 8 * Math.cos(angle - 0.4), ay - 8 * Math.sin(angle - 0.4));
      ctx.lineTo(ax - 8 * Math.cos(angle + 0.4), ay - 8 * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fill();
    }

    for (const n of sim) {
      const r = n.type === 'organization' ? RADIUS_ORG : RADIUS;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);

      if (n.type === 'organization') {
        ctx.fillStyle = '#f97316';
        ctx.shadowColor = '#f9731680';
        ctx.shadowBlur = 16;
      } else {
        ctx.fillStyle = '#3b82f6';
        ctx.shadowColor = '#3b82f680';
        ctx.shadowBlur = 10;
      }
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#fff';
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const label = n.type === 'organization' ? (n.siglas || n.label) : n.label.split(' ')[0];
      ctx.fillText(label, n.x, n.y + r + 4);
    }

    const avgV = sim.reduce((a, n) => a + Math.abs(n.vx) + Math.abs(n.vy), 0) / sim.length;
    if (avgV > MIN_VELOCITY) {
      tick();
      animRef.current = requestAnimationFrame(draw);
    }
  }, [edges, tick]);

  useEffect(() => {
    initSimulation();
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [initSimulation, draw]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        sizeRef.current = { width: Math.floor(width), height: Math.floor(height) };
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = Math.floor(width);
          canvas.height = Math.floor(height);
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const getNodeAt = useCallback((x: number, y: number): ForceNode | null => {
    for (const n of simRef.current) {
      const r = n.type === 'organization' ? RADIUS_ORG : RADIUS;
      const dx = n.x - x;
      const dy = n.y - y;
      if (dx * dx + dy * dy <= r * r) return n;
    }
    return null;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const node = getNodeAt(x, y);
    if (node) {
      dragRef.current = { node, ox: node.x - x, oy: node.y - y };
      canvasRef.current?.setPointerCapture(e.pointerId);
    }
  }, [getNodeAt]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const { node, ox, oy } = dragRef.current;
    if (!node || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    node.x = e.clientX - rect.left + ox;
    node.y = e.clientY - rect.top + oy;
    node.vx = 0;
    node.vy = 0;
  }, []);

  const handlePointerUp = useCallback(() => {
    dragRef.current.node = null;
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing rounded-lg"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  );
}

export { ForceGraph2D };