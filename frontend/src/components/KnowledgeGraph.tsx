import { useState } from 'react';
import { cn } from '@/lib/utils';

interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  ring: number;
}

interface GraphLink {
  source: string;
  target: string;
  active?: boolean;
}

interface KnowledgeGraphProps {
  className?: string;
  height?: number;
}

const centerNode: GraphNode = {
  id: 'cimat', label: 'CIMAT', x: 50, y: 50, radius: 6, color: '#E86A33', ring: 0,
};

const ring1: GraphNode[] = [
  { id: 'siderurgia', label: 'Siderurgia', x: 65, y: 50, radius: 4, color: '#C9A84C', ring: 1 },
  { id: 'metalurgia', label: 'Metalurgia', x: 50, y: 35, radius: 4, color: '#C9A84C', ring: 1 },
  { id: 'electronica', label: 'Electrónica', x: 35, y: 50, radius: 4, color: '#C9A84C', ring: 1 },
  { id: 'quimica', label: 'Química', x: 50, y: 65, radius: 4, color: '#C9A84C', ring: 1 },
];

const ring2: GraphNode[] = [
  { id: 'pat1', label: 'Pat. CU2024/001', x: 78, y: 50, radius: 3, color: '#2980B9', ring: 2 },
  { id: 'pat2', label: 'Soldadura Láser', x: 70, y: 70, radius: 3, color: '#2980B9', ring: 2 },
  { id: 'pat3', label: 'Reducción Directa', x: 50, y: 78, radius: 3, color: '#2980B9', ring: 2 },
  { id: 'pat4', label: 'ALEaciones Al', x: 30, y: 70, radius: 3, color: '#2980B9', ring: 2 },
  { id: 'pat5', label: 'Sensor IoT', x: 22, y: 50, radius: 3, color: '#2980B9', ring: 2 },
  { id: 'pat6', label: 'Bioprocesos', x: 30, y: 30, radius: 3, color: '#2980B9', ring: 2 },
  { id: 'pat7', label: 'Hidrógeno', x: 50, y: 22, radius: 3, color: '#2980B9', ring: 2 },
  { id: 'pat8', label: 'Nanocompuestos', x: 70, y: 30, radius: 3, color: '#2980B9', ring: 2 },
];

const ring3: GraphNode[] = [
  { id: 'mkt1', label: 'Mercado Acero', x: 90, y: 50, radius: 2.5, color: '#2D8A4E', ring: 3 },
  { id: 'mkt2', label: 'Industria Química', x: 85, y: 70, radius: 2.5, color: '#2D8A4E', ring: 3 },
  { id: 'mkt3', label: 'Energía Solar', x: 70, y: 85, radius: 2.5, color: '#2D8A4E', ring: 3 },
  { id: 'mkt4', label: 'Minería', x: 50, y: 90, radius: 2.5, color: '#2D8A4E', ring: 3 },
  { id: 'mkt5', label: 'Biotecnología', x: 30, y: 85, radius: 2.5, color: '#2D8A4E', ring: 3 },
  { id: 'mkt6', label: 'Automación', x: 15, y: 70, radius: 2.5, color: '#2D8A4E', ring: 3 },
  { id: 'mkt7', label: 'TIC', x: 10, y: 50, radius: 2.5, color: '#2D8A4E', ring: 3 },
  { id: 'mkt8', label: 'Defensa', x: 15, y: 30, radius: 2.5, color: '#2D8A4E', ring: 3 },
  { id: 'mkt9', label: 'Construcción', x: 30, y: 15, radius: 2.5, color: '#2D8A4E', ring: 3 },
  { id: 'mkt10', label: 'Textil', x: 50, y: 10, radius: 2.5, color: '#2D8A4E', ring: 3 },
  { id: 'mkt11', label: 'Logística', x: 70, y: 15, radius: 2.5, color: '#2D8A4E', ring: 3 },
  { id: 'mkt12', label: 'Automotriz', x: 85, y: 30, radius: 2.5, color: '#2D8A4E', ring: 3 },
];

const allNodes = [centerNode, ...ring1, ...ring2, ...ring3];

const links: GraphLink[] = [
  { source: 'cimat', target: 'siderurgia', active: true },
  { source: 'cimat', target: 'metalurgia', active: true },
  { source: 'cimat', target: 'electronica' },
  { source: 'cimat', target: 'quimica' },
  { source: 'siderurgia', target: 'pat1' },
  { source: 'siderurgia', target: 'pat3' },
  { source: 'metalurgia', target: 'pat2' },
  { source: 'metalurgia', target: 'pat4' },
  { source: 'electronica', target: 'pat5' },
  { source: 'electronica', target: 'pat8' },
  { source: 'quimica', target: 'pat6' },
  { source: 'quimica', target: 'pat7' },
  { source: 'pat1', target: 'mkt1' },
  { source: 'pat2', target: 'mkt1' },
  { source: 'pat3', target: 'mkt2' },
  { source: 'pat4', target: 'mkt2' },
  { source: 'pat5', target: 'mkt6' },
  { source: 'pat5', target: 'mkt7' },
  { source: 'pat6', target: 'mkt5' },
  { source: 'pat7', target: 'mkt3' },
  { source: 'pat8', target: 'mkt9' },
  { source: 'pat8', target: 'mkt12' },
];

const legend = [
  { color: '#E86A33', label: 'Entidad CTI (centro)' },
  { color: '#C9A84C', label: 'Sectores industriales' },
  { color: '#2980B9', label: 'Patentes / Tecnologías' },
  { color: '#2D8A4E', label: 'Mercados / Aplicaciones' },
];

export default function KnowledgeGraph({ className, height = 400 }: KnowledgeGraphProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const isConnected = (nodeId: string) => {
    if (!hoveredId) return true;
    if (nodeId === hoveredId) return true;
    return links.some(
      (l) => (l.source === hoveredId && l.target === nodeId) || (l.target === hoveredId && l.source === nodeId),
    );
  };

  return (
    <div className={cn('relative rounded-lg overflow-hidden', className)} style={{ height }} role="img" aria-label="Grafo de conocimiento con nodos y relaciones del ecosistema CTI">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ background: 'linear-gradient(180deg, #0A2540 0%, #143D5C 100%)' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
          </pattern>
          <filter id="glow-orange">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#E86A33" floodOpacity="0.5" />
          </filter>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />

        {/* Concentric ring guides */}
        <circle cx={50} cy={50} r={15} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.3" strokeDasharray="1.5 1.5" />
        <circle cx={50} cy={50} r={28} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.3" strokeDasharray="1.5 1.5" />
        <circle cx={50} cy={50} r={40} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.3" strokeDasharray="1.5 1.5" />

        {/* Links */}
        {links.map((link, i) => {
          const source = allNodes.find((n) => n.id === link.source);
          const target = allNodes.find((n) => n.id === link.target);
          if (!source || !target) return null;
          const connected = !hoveredId || hoveredId === link.source || hoveredId === link.target;
          return (
            <line
              key={`link-${i}`}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke={link.active ? '#E86A33' : 'rgba(255,255,255,0.08)'}
              strokeWidth={link.active ? 0.6 : 0.4}
              strokeOpacity={connected ? 1 : 0.15}
              className="transition-all duration-150"
            />
          );
        })}

        {/* Nodes */}
        {allNodes.map((node) => {
          const connected = isConnected(node.id);
          return (
            <g
              key={node.id}
              className="transition-all duration-150 cursor-pointer"
              style={{ transformOrigin: `${node.x}px ${node.y}px` }}
              onMouseEnter={() => setHoveredId(node.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={node.radius}
                fill={node.color}
                opacity={connected ? 0.9 : 0.2}
                className="transition-all duration-150"
                filter={hoveredId === node.id ? 'url(#glow-orange)' : undefined}
                style={hoveredId === node.id ? { transform: 'scale(1.2)' } : undefined}
              />
              <text
                x={node.x}
                y={node.y + node.radius + 1.8}
                textAnchor="middle"
                fill={connected ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.2)'}
                fontSize={1.8}
                fontWeight="500"
                className="pointer-events-none transition-all duration-150"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Status badge */}
      <div className="absolute top-4 left-4 z-10">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-[8px] px-3 py-2 rounded-md border border-white/20">
          <span className="w-2 h-2 rounded-full bg-accent-orange animate-pulse-dot" />
          <span className="text-xs font-semibold text-white/90">
            Grafo activo · {allNodes.length} nodos · {links.length} relaciones
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="flex flex-col gap-2 bg-[rgba(10,37,64,0.85)] backdrop-blur-[8px] px-3 py-3 rounded-md border border-white/10">
          {legend.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-[11px] text-white/70">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
