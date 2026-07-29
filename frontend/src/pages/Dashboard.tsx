import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, BookOpen, Users, AlertTriangle, Plus, Download, Clock, Eye } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import PageHeader from '@/components/PageHeader';
import KPICard from '@/components/KPICard';
import SectorPills from '@/components/SectorPills';
import AlertList from '@/components/AlertList';
import EntityTable from '@/components/EntityTable';
import Timeline from '@/components/Timeline';
import KnowledgeGraph from '@/components/KnowledgeGraph';
import ProductCard from '@/components/ProductCard';
import FullExportPDF from '@/components/FullExportPDF';
import { Button } from '@/components/ui/button';
import { useAlerts } from '@/hooks/useAlerts';
import { useDashboardKPIs, useTimelineEvents } from '@/hooks/useDashboard';
import { getPatents } from '@/api/patents';
import { getTechnologies } from '@/api/technologies';
import { getOrganizations } from '@/api/organizations';
import { getRegulations } from '@/api/regulations';
import { getIndicators } from '@/api/indicators';
import { listBulletins } from '@/api/bulletins';
import { getIndustrialSectors } from '@/api/industrialSectors';
import { listAlerts } from '@/api/alerts';
import { getDashboardKPIs, getTimelineEvents } from '@/api/dashboard';
import type { Alert, DashboardKPI, TimelineEvent } from '@/types';

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

const entities = [
  { id: '1', name: 'Centro de Investigación de Materiales', initials: 'CIMAT', type: 'Centro de Investigación', status: 'active' as const, progress: 94 },
  { id: '2', name: 'Universidad Central de Las Villas', initials: 'UCLV', type: 'Universidad', status: 'active' as const, progress: 87 },
  { id: '3', name: 'Centro de Innovación Metalúrgica', initials: 'CIME', type: 'Centro de Innovación', status: 'pending' as const, progress: 45 },
  { id: '4', name: 'Instituto Nacional de Innovación y Desarrollo Tecnológico', initials: 'INIDT', type: 'Instituto Tecnológico', status: 'active' as const, progress: 78 },
  { id: '5', name: 'Universidad de las Ciencias Informáticas', initials: 'UCI', type: 'Universidad', status: 'inactive' as const, progress: 12 },
];

const products = [
  { type: 'estudio' as const, title: 'Análisis de competitividad del sector metalúrgico cubano vs. Brasil 2026', excerpt: 'Estudio comparativo de indicadores de productividad, capacidad instalada y penetración de mercado del sector metalúrgico cubano frente al brasileño.', meta: [{ icon: <FileText className="h-3 w-3" />, text: '42 páginas' }, { icon: <Clock className="h-3 w-3" />, text: 'Hace 3d' }, { icon: <Users className="h-3 w-3" />, text: 'Dr. Méndez' }] },
  { type: 'boletin' as const, title: 'Boletín Tecnológico Quincenal — Sector Electrónica', excerpt: 'Compendio de novedades tecnológicas, patentes y publicaciones del sector electrónico con énfasis en semiconductores y sensores IoT.', meta: [{ icon: <FileText className="h-3 w-3" />, text: '156 lecturas' }, { icon: <Clock className="h-3 w-3" />, text: 'Hace 5d' }, { icon: <Users className="h-3 w-3" />, text: 'EDI' }] },
  { type: 'alerta' as const, title: 'Disrupción detectada: nuevos materiales en soldadura de aleaciones de aluminio', excerpt: 'Identificación temprana de una innovación disruptiva en procesos de soldadura por fricción-agitación para aleaciones de aluminio de alta resistencia.', meta: [{ icon: <FileText className="h-3 w-3" />, text: 'Prioridad alta' }, { icon: <Clock className="h-3 w-3" />, text: 'Hace 1d' }, { icon: <Users className="h-3 w-3" />, text: 'CIMAT' }] },
];

function mapSeverityToPriority(severity: Alert['severidad']): 'high' | 'medium' | 'low' {
  switch (severity) {
    case 'alta':
      return 'high';
    case 'media':
      return 'medium';
    case 'baja':
      return 'low';
    default:
      return 'medium';
  }
}

function mapAlertToAlertItem(alert: Alert) {
  return {
    id: alert.id,
    priority: mapSeverityToPriority(alert.severidad),
    title: alert.titulo,
    description: alert.descripcion,
    time: alert.fecha,
    tag: {
      label: alert.sector || 'General',
      variant: 'accent' as const,
    },
  };
}

function mapKPIToCardProps(kpi: DashboardKPI) {
  const iconMap: Record<string, React.ReactNode> = {
    FileText: <FileText className="h-4 w-4" />,
    BookOpen: <BookOpen className="h-4 w-4" />,
    Users: <Users className="h-4 w-4" />,
    AlertTriangle: <AlertTriangle className="h-4 w-4" />,
  };
  const iconBgMap: Record<string, 'blue' | 'orange' | 'green' | 'gold'> = {
    FileText: 'blue',
    BookOpen: 'orange',
    Users: 'green',
    AlertTriangle: 'gold',
  };
  return {
    label: kpi.label,
    value: kpi.value.toLocaleString(),
    change: `${kpi.change >= 0 ? '+' : ''}${kpi.change}%`,
    changeType: kpi.change >= 0 ? 'positive' as const : 'negative' as const,
    icon: iconMap[kpi.icon] || <FileText className="h-4 w-4" />,
    iconBg: iconBgMap[kpi.icon] || 'blue',
  };
}

function mapTimelineToEvent(event: TimelineEvent) {
  return {
    id: event.id,
    content: event.titulo,
    highlight: event.titulo.split(':')[0] || event.titulo,
    time: new Date(event.fecha).toLocaleDateString('es-ES', { hour: '2-digit', minute: '2-digit' }),
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeSector, setActiveSector] = useState('all');
  const [exporting, setExporting] = useState(false);
  const { data: rawAlerts, isLoading: alertsLoading } = useAlerts();
  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs();
  const { data: rawTimeline, isLoading: timelineLoading } = useTimelineEvents();

  const alerts = rawAlerts?.map(mapAlertToAlertItem) || [];
  const timelineEvents = rawTimeline?.map(mapTimelineToEvent) || [];

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      async function fetchSafe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
        try { return await fn(); } catch { return fallback; }
      }
      const [
        kpisRes, patentsRes, techRes, orgsRes, regsRes,
        indicsRes, alertsRes, bullsRes, sectorsRes, timelineRes,
      ] = await Promise.all([
        fetchSafe(() => getDashboardKPIs(), []),
        fetchSafe(() => getPatents(1, 200), { items: [], total: 0, page: 1, per_page: 200, total_pages: 0 }),
        fetchSafe(() => getTechnologies(1, 200), { items: [], total: 0, page: 1, per_page: 200, total_pages: 0 }),
        fetchSafe(() => getOrganizations(1, 200), { items: [], total: 0, page: 1, per_page: 200, total_pages: 0 }),
        fetchSafe(() => getRegulations(1, 200), { items: [], total: 0, page: 1, per_page: 200, total_pages: 0 }),
        fetchSafe(() => getIndicators(1, 200), { items: [], total: 0, page: 1, per_page: 200, total_pages: 0 }),
        fetchSafe(() => listAlerts(), []),
        fetchSafe(() => listBulletins(1, 200), { items: [], total: 0, page: 1, per_page: 200, total_pages: 0 }),
        fetchSafe(() => getIndustrialSectors(1, 200), { items: [], total: 0, page: 1, per_page: 200, total_pages: 0 }),
        fetchSafe(() => getTimelineEvents(), []),
      ]);
      const blob = await pdf(
        <FullExportPDF
          kpis={kpisRes}
          patents={patentsRes.items}
          technologies={techRes.items}
          organizations={orgsRes.items}
          regulations={regsRes.items}
          indicators={indicsRes.items}
          alerts={alertsRes}
          bulletins={bullsRes.items}
          industrialSectors={sectorsRes.items}
          timeline={timelineRes}
          generatedAt={new Date().toLocaleString('es-ES')}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `informe-completo-${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, []);

  return (
    <div className="space-y-10">
      {/* Section 1 — Header */}
      <PageHeader
        title="Panel de Inteligencia Tecnológica"
        highlight="Inteligencia"
        description="Vigilancia tecnológica y competitividad industrial — datos actualizados en tiempo real desde fuentes internas y externas."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" className="gap-2" onClick={handleExport} disabled={exporting}>
              <Download className={`h-4 w-4 ${exporting ? 'animate-spin' : ''}`} />
              {exporting ? 'Exportando...' : 'Exportar'}
            </Button>
            <Button className="gap-2" onClick={() => navigate('/alerts')}>
              <Plus className="h-4 w-4" />
              Nueva Alerta
            </Button>
          </div>
        }
      />

      <SectorPills sectors={sectors} active={activeSector} onChange={setActiveSector} />

      {/* Section 2 — KPIs */}
      <section>
        {kpisLoading ? (
          <div className="text-center text-text-muted py-8">Cargando KPIs...</div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {kpis?.map((kpi, i) => (
              <KPICard key={i} {...mapKPIToCardProps(kpi)} />
            ))}
          </div>
        )}
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
            {alertsLoading ? (
              <div className="text-center text-text-muted py-8">Cargando alertas...</div>
            ) : (
              <AlertList alerts={alerts} />
            )}
          </div>
        </div>
      </section>

      {/* Section 4 — Entidades + Timeline (1fr + 1fr) */}
      <section>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-foreground">Entidades CTI</h3>
              <Button variant="link" size="sm" className="text-accent-orange gap-1">
                <Eye className="h-3.5 w-3.5" />
                Ver todas
              </Button>
            </div>
            <div className="bg-surface rounded-lg border border-border flex-1">
              <EntityTable entities={entities} />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-foreground">Actividad Reciente</h3>
            </div>
            <div className="bg-surface rounded-lg border border-border p-5 flex-1 mt-3">
              {timelineLoading ? (
                <div className="text-center text-text-muted py-8">Cargando actividad reciente...</div>
              ) : (
                <Timeline events={timelineEvents.slice(0, 6)} />
              )}
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
