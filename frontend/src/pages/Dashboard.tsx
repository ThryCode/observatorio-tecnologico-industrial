import { useState } from 'react';
import { FileText, BookOpen, Users, AlertTriangle, Plus, Download, Clock, Eye } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import KPICard from '@/components/KPICard';
import SectorPills from '@/components/SectorPills';
import AlertList from '@/components/AlertList';
import EntityTable from '@/components/EntityTable';
import Timeline from '@/components/Timeline';
import KnowledgeGraph from '@/components/KnowledgeGraph';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';

const sectors = [
  { id: 'all', label: 'Todos', count: 2847 },
  { id: 'sid', label: 'Siderurgia', count: 412 },
  { id: 'met', label: 'Metalurgia', count: 389 },
  { id: 'ele', label: 'Electrónica', count: 567 },
  { id: 'qui', label: 'Química', count: 298 },
  { id: 'aut', label: 'Automatización', count: 456 },
  { id: 'ene', label: 'Energía', count: 234 },
  { id: 'bio', label: 'Biotecnología', count: 187 },
];

const alerts = [
  { id: '1', priority: 'high' as const, title: 'Nueva patente en soldadura por arco submarina', description: 'Siemens AG registró patente EP2026... para el sector siderúrgico con potencial aplicación en la industria naval cubana.', time: 'Hace 2h', tag: { label: 'Patente', variant: 'accent' as const } },
  { id: '2', priority: 'medium' as const, title: 'Cambio regulatorio en importación de tecnología siderúrgica', description: 'Resolución MINDUS 45/2026 actualiza los requisitos de importación de equipos de colada continua.', time: 'Hace 5h', tag: { label: 'Normativa', variant: 'info' as const } },
  { id: '3', priority: 'low' as const, title: 'Tendencia emergente: refrigeración por absorción en sector químico', description: 'Publicaciones científicas sobre refrigeración por absorción crecieron 40% en el último trimestre.', time: 'Hace 1d', tag: { label: 'Tecnología', variant: 'success' as const } },
  { id: '4', priority: 'medium' as const, title: 'Oportunidad de colaboración detectada: UCLV + CIMAT en metalurgia', description: 'Solapamiento del 78% en capacidades de investigación en procesamiento de aleaciones no ferrosas.', time: 'Hace 1d', tag: { label: 'Mercado', variant: 'gold' as const } },
];

const entities = [
  { id: '1', name: 'Centro de Investigación de Materiales', initials: 'CIMAT', type: 'Centro de Investigación', status: 'active' as const, progress: 94 },
  { id: '2', name: 'Universidad Central de Las Villas', initials: 'UCLV', type: 'Universidad', status: 'active' as const, progress: 87 },
  { id: '3', name: 'Centro de Innovación Metalúrgica', initials: 'CIME', type: 'Centro de Innovación', status: 'pending' as const, progress: 45 },
  { id: '4', name: 'Instituto Nacional de Innovación y Desarrollo Tecnológico', initials: 'INIDT', type: 'Instituto Tecnológico', status: 'active' as const, progress: 78 },
  { id: '5', name: 'Universidad de las Ciencias Informáticas', initials: 'UCI', type: 'Universidad', status: 'inactive' as const, progress: 12 },
];

const timelineEvents = [
  { id: '1', content: 'CIMAT cargó 23 nuevas patentes en el sector siderurgia', highlight: '23 nuevas patentes', time: 'Hace 35 min' },
  { id: '2', content: 'Alerta automática generada: disrupción en soldadura láser', highlight: 'soldadura láser', time: 'Hace 2h' },
  { id: '3', content: 'Boletín semanal enviado a 47 suscriptores', highlight: '47 suscriptores', time: 'Hace 5h' },
  { id: '4', content: 'Nueva entidad CTI conectada: INIDT', highlight: 'INIDT', time: 'Hace 1d' },
];

const products = [
  { type: 'estudio' as const, title: 'Análisis de competitividad del sector metalúrgico cubano vs. Brasil 2026', excerpt: 'Estudio comparativo de indicadores de productividad, capacidad instalada y penetración de mercado del sector metalúrgico cubano frente al brasileño.', meta: [{ icon: <FileText className="h-3 w-3" />, text: '42 páginas' }, { icon: <Clock className="h-3 w-3" />, text: 'Hace 3d' }, { icon: <Users className="h-3 w-3" />, text: 'Dr. Méndez' }] },
  { type: 'boletin' as const, title: 'Boletín Tecnológico Quincenal — Sector Electrónica', excerpt: 'Compendio de novedades tecnológicas, patentes y publicaciones del sector electrónico con énfasis en semiconductores y sensores IoT.', meta: [{ icon: <FileText className="h-3 w-3" />, text: '156 lecturas' }, { icon: <Clock className="h-3 w-3" />, text: 'Hace 5d' }, { icon: <Users className="h-3 w-3" />, text: 'EDI' }] },
  { type: 'alerta' as const, title: 'Disrupción detectada: nuevos materiales en soldadura de aleaciones de aluminio', excerpt: 'Identificación temprana de una innovación disruptiva en procesos de soldadura por fricción-agitación para aleaciones de aluminio de alta resistencia.', meta: [{ icon: <FileText className="h-3 w-3" />, text: 'Prioridad alta' }, { icon: <Clock className="h-3 w-3" />, text: 'Hace 1d' }, { icon: <Users className="h-3 w-3" />, text: 'CIMAT' }] },
];

export default function Dashboard() {
  const [activeSector, setActiveSector] = useState('all');

  return (
    <div className="space-y-10">
      {/* Section 1 — Header */}
      <PageHeader
        title="Panel de Inteligencia Tecnológica"
        highlight="Inteligencia"
        description="Vigilancia tecnológica y competitividad industrial — datos actualizados en tiempo real desde fuentes internas y externas."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Alerta
            </Button>
          </div>
        }
      />

      <SectorPills sectors={sectors} active={activeSector} onChange={setActiveSector} />

      {/* Section 2 — KPIs */}
      <section>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <KPICard label="Patentes Indexadas" value="12,847" change="+14.3%" changeType="positive" icon={<FileText className="h-4 w-4" />} iconBg="blue" />
          <KPICard label="Publicaciones Científicas" value="3,421" change="+8.7%" changeType="positive" icon={<BookOpen className="h-4 w-4" />} iconBg="orange" />
          <KPICard label="Entidades CTI Conectadas" value="47" change="+3" changeType="positive" icon={<Users className="h-4 w-4" />} iconBg="green" />
          <KPICard label="Alertas Activas" value="7" change="-2" changeType="negative" icon={<AlertTriangle className="h-4 w-4" />} iconBg="gold" />
        </div>
      </section>

      {/* Section 3 — Grafo + Alertas (2fr + 1fr) */}
      <section>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h3 className="text-base font-bold text-foreground mb-3">Grafo de Conocimiento Industrial</h3>
            <KnowledgeGraph height={400} className="rounded-lg border border-border" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground mb-3">Alertas Recientes</h3>
            <AlertList alerts={alerts} />
          </div>
        </div>
      </section>

      {/* Section 4 — Entidades + Timeline (1fr + 1fr) */}
      <section>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-foreground">Entidades CTI</h3>
              <Button variant="link" size="sm" className="text-accent-orange gap-1">
                <Eye className="h-3.5 w-3.5" />
                Ver todas
              </Button>
            </div>
            <div className="bg-surface rounded-lg border border-border">
              <EntityTable entities={entities} />
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground mb-3">Actividad Reciente</h3>
            <div className="bg-surface rounded-lg border border-border p-5">
              <Timeline events={timelineEvents} />
            </div>
          </div>
        </div>
      </section>

      {/* Section 5 — Productos de Inteligencia (3 columnas) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-foreground">Productos de Inteligencia</h3>
          <Button variant="link" size="sm" className="text-accent-orange gap-1">
            <Eye className="h-3.5 w-3.5" />
            Ver todos
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product, i) => (
            <ProductCard key={i} {...product} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border">
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <span>© 2026 MINDUS · Observatorio Tecnológico Industrial</span>
          <span className="hidden sm:inline text-border-strong">·</span>
          <span className="hidden sm:inline">Documentación</span>
          <span className="hidden sm:inline text-border-strong">·</span>
          <span className="hidden sm:inline">Soporte</span>
          <span className="hidden sm:inline text-border-strong">·</span>
          <span className="hidden sm:inline">Privacidad</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="font-mono">v2.4.0</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-dot" />
            Última sincronización: hace 5 min
          </span>
        </div>
      </footer>
    </div>
  );
}
