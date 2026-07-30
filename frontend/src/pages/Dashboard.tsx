import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
import { getDashboardKPIs, getTimelineEvents, getDashboardSectors } from '@/api/dashboard';
import type { Alert, DashboardKPI, TimelineEvent, Organization } from '@/types';
import type { BulletinListItem } from '@/api/bulletins';
import type { Entity } from '@/components/EntityTable';
import type { ProductCardProps } from '@/components/ProductCard';

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

function labelToIconKey(label: string): 'users' | 'file-text' | 'book-open' | 'alert-triangle' {
  const map: Record<string, 'users' | 'file-text' | 'book-open' | 'alert-triangle'> = {
    Organizaciones: 'users',
    Patentes: 'file-text',
    Tecnologías: 'book-open',
    Indicadores: 'alert-triangle',
    Alertas: 'alert-triangle',
  };
  return map[label] || 'file-text';
}

function mapKPIToCardProps(kpi: DashboardKPI) {
  const iconMap: Record<string, React.ReactNode> = {
    'file-text': <FileText className="h-4 w-4" />,
    'book-open': <BookOpen className="h-4 w-4" />,
    'users': <Users className="h-4 w-4" />,
    'alert-triangle': <AlertTriangle className="h-4 w-4" />,
  };
  const iconBgMap: Record<string, 'blue' | 'orange' | 'green' | 'gold'> = {
    'file-text': 'blue',
    'book-open': 'orange',
    'users': 'green',
    'alert-triangle': 'gold',
  };
  const iconKey = labelToIconKey(kpi.label);
  return {
    label: kpi.label,
    value: kpi.value.toLocaleString(),
    change: `${kpi.change >= 0 ? '+' : ''}${kpi.change}%`,
    changeType: kpi.change >= 0 ? 'positive' as const : 'negative' as const,
    icon: iconMap[iconKey] || <FileText className="h-4 w-4" />,
    iconBg: iconBgMap[iconKey] || 'blue',
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

const tipoMap: Record<string, string> = {
  centro_investigacion: 'Centro de Investigación',
  instituto_tecnologico: 'Instituto Tecnológico',
  universidad: 'Universidad',
  empresa: 'Empresa',
  ministerio: 'Ministerio',
};

function mapOrgToEntity(org: Organization): Entity {
  return {
    id: org.id,
    name: org.nombre,
    initials: org.siglas,
    type: tipoMap[org.tipo] || org.tipo,
    status: 'active' as const,
    progress: 78,
  };
}

function mapBulletinToProduct(bulletin: BulletinListItem): ProductCardProps {
  const age = getRelativeTime(new Date(bulletin.fecha));
  const type = bulletin.categoria === 'alerta' ? 'alerta' : 'boletin';
  return {
    type,
    title: bulletin.titulo,
    excerpt: bulletin.resumen,
    meta: [
      { icon: <FileText className="h-3 w-3" />, text: bulletin.categoria },
      { icon: <Clock className="h-3 w-3" />, text: age },
      { icon: <Users className="h-3 w-3" />, text: bulletin.autor || 'Sistema' },
    ],
  };
}

function getRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days > 30) return `Hace ${Math.floor(days / 30)}m`;
  if (days > 0) return `Hace ${days}d`;
  const hours = Math.floor(diff / 3600000);
  if (hours > 0) return `Hace ${hours}h`;
  return 'Ahora';
}

async function fetchSafe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn(); } catch { return fallback; }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeSector, setActiveSector] = useState('all');
  const [exporting, setExporting] = useState(false);
  const { data: rawAlerts, isLoading: alertsLoading, isError: alertsError } = useAlerts();
  const { data: kpis, isLoading: kpisLoading, isError: kpisError } = useDashboardKPIs();
  const { data: rawTimeline, isLoading: timelineLoading, isError: timelineError } = useTimelineEvents();
  const { data: sectorsData, isLoading: sectorsLoading, isError: sectorsError } = useQuery({
    queryKey: ['dashboard', 'sectors'],
    queryFn: getDashboardSectors,
    staleTime: 5 * 60 * 1000,
  });
  const { data: orgsData, isLoading: orgsLoading, isError: orgsError } = useQuery({
    queryKey: ['organizations', { page: 1, per_page: 5 }],
    queryFn: () => getOrganizations(1, 5),
  });
  const { data: bulletinsData, isLoading: bulletinsLoading, isError: bulletinsError } = useQuery({
    queryKey: ['bulletins', { page: 1, per_page: 3 }],
    queryFn: () => listBulletins(1, 3),
  });

  const alerts = rawAlerts?.map(mapAlertToAlertItem) || [];
  const timelineEvents = rawTimeline?.map(mapTimelineToEvent) || [];
  const totalCount = sectorsData?.reduce((s, item) => s + item.count, 0) || 0;
  const sectors = [
    { id: 'all', label: 'Todos', count: totalCount },
    ...(sectorsData || []).map((s) => ({ id: s.codigo.toLowerCase(), label: s.nombre, count: s.count })),
  ];
  const entities = (orgsData?.items || []).map(mapOrgToEntity);
  const products = (bulletinsData?.items || []).slice(0, 3).map(mapBulletinToProduct);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
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

      {sectorsError ? (
        <div className="text-center text-red-500 py-4">Error al cargar sectores</div>
      ) : sectorsLoading ? (
        <div className="text-center text-text-muted py-4">Cargando sectores...</div>
      ) : (
        <SectorPills sectors={sectors} active={activeSector} onChange={setActiveSector} />
      )}

      {/* Section 2 — KPIs */}
      <section>
        {kpisError ? (
          <div className="text-center text-red-500 py-8">Error al cargar KPIs</div>
        ) : kpisLoading ? (
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
            <KnowledgeGraph height={620} className="rounded-lg border border-border" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground mb-3">Alertas Recientes</h3>
            {alertsError ? (
              <div className="text-center text-red-500 py-8">Error al cargar alertas</div>
            ) : alertsLoading ? (
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
              <Button variant="link" size="sm" className="text-accent-orange gap-1" onClick={() => navigate('/organizations')}>
                <Eye className="h-3.5 w-3.5" />
                Ver todas
              </Button>
            </div>
            <div className="bg-surface rounded-lg border border-border flex-1">
              {orgsError ? (
                <div className="text-center text-red-500 py-8">Error al cargar entidades</div>
              ) : orgsLoading ? (
                <div className="text-center text-text-muted py-8">Cargando entidades...</div>
              ) : (
                <EntityTable entities={entities} />
              )}
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-foreground">Actividad Reciente</h3>
            </div>
            <div className="bg-surface rounded-lg border border-border p-5 flex-1 mt-3">
              {timelineError ? (
                <div className="text-center text-red-500 py-8">Error al cargar actividad reciente</div>
              ) : timelineLoading ? (
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
          <Button variant="link" size="sm" className="text-accent-orange gap-1" onClick={() => navigate('/bulletins')}>
            <Eye className="h-3.5 w-3.5" />
            Ver todos
          </Button>
        </div>
        {bulletinsError ? (
          <div className="text-center text-red-500 py-8">Error al cargar productos</div>
        ) : bulletinsLoading ? (
          <div className="text-center text-text-muted py-8">Cargando productos...</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product, i) => (
              <ProductCard key={i} {...product} />
            ))}
          </div>
        )}
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
