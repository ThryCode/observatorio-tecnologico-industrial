// Paleta centralizada del grafo de conocimiento, gráficos y exportación PDF.

export const nodeTypeHex: Record<string, string> = {
  Technology: '#3b82f6',        // blue-500
  Organization: '#10b981',      // emerald-500
  Patent: '#f97316',            // orange-500
  Regulation: '#ef4444',        // red-500
  Person: '#eab308',            // yellow-500
  Indicator: '#a855f7',         // purple-500
  IndustrialSector: '#64748b',  // slate-500
  Cluster: '#06b6d4',           // cyan-500
  default: '#06b6d4',
};

export interface NodePalette {
  node: string;
  edge: string;
  label: string;
}

export const graphNodePalette: Record<string, NodePalette> = {
  Technology: { node: '#3b82f6', edge: 'rgba(59,130,246,0.7)', label: 'rgb(147, 197, 253)' },
  Organization: { node: '#10b981', edge: 'rgba(16,185,129,0.7)', label: 'rgb(110, 231, 183)' },
  Patent: { node: '#f97316', edge: 'rgba(249,115,22,0.7)', label: 'rgb(251, 191, 143)' },
  Regulation: { node: '#ef4444', edge: 'rgba(239,68,68,0.7)', label: 'rgb(252, 165, 165)' },
  Person: { node: '#eab308', edge: 'rgba(234,179,8,0.7)', label: 'rgb(252, 211, 77)' },
  Indicator: { node: '#a855f7', edge: 'rgba(168,85,247,0.7)', label: 'rgb(216, 180, 254)' },
  IndustrialSector: { node: '#64748b', edge: 'rgba(100,116,139,0.7)', label: 'rgb(148, 163, 184)' },
  Cluster: { node: '#06b6d4', edge: 'rgba(6,182,212,0.7)', label: 'rgb(103, 232, 249)' },
};

export const DEFAULT_NODE_PALETTE: NodePalette = {
  node: '#06b6d4',
  edge: 'rgba(6,182,212,0.7)',
  label: 'rgb(103, 232, 249)',
};

export const chartColors = {
  accent: '#E86A33',  // naranja de marca (Cuba / patentes)
  gold: '#C9A84C',    // dorado institucional (Chile)
  blue: '#2980B9',    // azul de marca (México)
  green: '#2D8A4E',   // verde de marca (Brasil)
} as const;

export const pdfColors = {
  text: '#1a1a2e',        // título principal
  secondary: '#6b7280',   // subtítulos y encabezados de tabla
  muted: '#9ca3af',       // meta y footer
  border: '#d1d5db',      // bordes de sección
  borderLight: '#e5e7eb', // borde superior del footer
  rowBorder: '#f3f4f6',   // separadores de fila
  cardBg: '#f9fafb',      // fondo de tarjetas KPI
  accent: '#059669',      // cambios positivos
  danger: '#dc2626',      // cambios negativos
} as const;
