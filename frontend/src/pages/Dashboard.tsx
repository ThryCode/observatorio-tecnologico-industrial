import { lazy, Suspense, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, BookOpen, Users, AlertTriangle, GraduationCap, Plus, Download, Clock, Eye } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import KPICard from '@/components/KPICard';
import SectorPills from '@/components/SectorPills';
import AlertList from '@/components/AlertList';
import EntityTable from '@/components/EntityTable';
import DashboardTimeline from '@/components/DashboardTimeline';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/ui/empty-state';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { Button } from '@/components/ui/button';
import { Skeleton, CardSkeleton, TableSkeleton } from '@/components/ui/skeleton';
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
import { mapAlertToAlertItem } from '@/utils/alertUtils';
import { queryKeys } from '@/lib/queryKeys';
import type { DashboardKPI, Organization } from '@/types';
import type { BulletinListItem } from '@/api/bulletins';
import type { Entity } from '@/components/EntityTable';
import type { ProductCardProps } from '@/components/ProductCard';

const KnowledgeGraph = lazy(() => import('@/components/KnowledgeGraph'));

type IconKey = 'users' | 'file-text' | 'book-open' | 'alert-triangle' | 'graduation';

const iconMap: Record<IconKey, React.ReactNode> = {
  'file-text': <FileText className="h-4 w-4" />,
  'book-open': <BookOpen className="h-4 w-4" />,
  'users': <Users className="h-4 w-4" />,
  'alert-triangle': <AlertTriangle className="h-4 w-4" />,
  'graduation': <GraduationCap className="h-4 w-4" />,
};

const iconBgMap: Record<string, 'blue' | 'orange' | 'green' | 'gold'> = {
  'file-text': 'blue',
  'book-open': 'orange',
  'users': 'green',
  'alert-triangle': 'gold',
  'graduation': 'blue',
};

// TODO: tipar el KPI por código/type del backend en lugar de label en español (frágil ante cambios de labels)
function labelToIconKey(label: string): IconKey {
  const map: Record<string, IconKey> = {
    Organizaciones: 'users',
    Patentes: 'file-text',
    Tecnologías: 'book-open',
    Indicadores: 'alert-triangle',
    Alertas: 'alert-triangle',
    Estudio: 'graduation',
    Investigación: 'graduation',
    Publicaciones: 'book-open',
    Organizacion: 'users',
    Patente: 'file-text',
    Tecnología: 'book-open',
    Indicador: 'alert-triangle',
    Alerta: 'alert-triangle',
  };
  return map[label] || 'file-text';
}

function mapKPIToCardProps(kpi: DashboardKPI) {
  const iconKey = labelToIconKey(kpi.label);
  return {
    label: kpi.label,
    value: kpi.value.toLocaleString(),
    change: `${kpi.change >= 0 ? '+' : ''}${kpi.change}%`,
    changeType: kpi.change >= 0 ? 'positive' as const : 'negative' as const,
    icon: iconMap[iconKey],
    iconBg: iconBgMap[iconKey],
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
  };
}

function mapBulletinToProduct(bulletin: BulletinListItem): ProductCardProps {
  const age = getRelativeTime(new Date(bulletin.fecha));
  const validTypes = ['alerta', 'boletin', 'estudio', 'mapa'] as const;
  const type = validTypes.includes(bulletin.categoria as typeof validTypes[number])
    ? bulletin.categoria as typeof validTypes[number]
    : 'boletin';
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
  const [activeSectors, setActiveSectors] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const sectorParam = activeSectors.length > 0 ? activeSectors.map((s) => s.toUpperCase()).join(',') : undefined;
  const { data: rawAlerts, isLoading: alertsLoading, isError: alertsError } = useAlerts(false, 1, 5, undefined, undefined, sectorParam);
  const { data: kpis, isLoading: kpisLoading, isError: kpisError } = useDashboardKPIs(sectorParam);
  const { data: rawTimeline, isLoading: timelineLoading, isError: timelineError } = useTimelineEvents(sectorParam);
  const { data: sectorsData, isLoading: sectorsLoading, isError: sectorsError } = useQuery({
    queryKey: queryKeys.dashboardSectors(),
    queryFn: getDashboardSectors,
    staleTime: 5 * 60 * 1000,
  });
  const { data: orgsData, isLoading: orgsLoading, isError: orgsError } = useQuery({
    queryKey: queryKeys.organizations.list(1, 5, sectorParam),
    queryFn: () => getOrganizations(1, 5, sectorParam),
  });
  const { data: bulletinsData, isLoading: bulletinsLoading, isError: bulletinsError } = useQuery({
    queryKey: queryKeys.bulletins.list(1, 3),
    queryFn: () => listBulletins(1, 3),
  });

  const alerts = (rawAlerts?.items ?? []).map(mapAlertToAlertItem) || [];
  const timelineEvents = rawTimeline || [];
  const totalCount = sectorsData?.reduce((s, item) => s + item.count, 0) || 0;
  const sectors = [
    { id: 'all', label: 'Todos', count: totalCount },
    ...(sectorsData || []).map((s) => ({ id: s.codigo.toLowerCase(), label: s.nombre, count: s.count })),
  ];
  const entities = (orgsData?.items || []).map(mapOrgToEntity);
  const kpiCards = useMemo(() => (kpis ?? []).map(mapKPIToCardProps), [kpis]);
  const products = useMemo(
    () => (bulletinsData?.items || []).slice(0, 3).map(mapBulletinToProduct),
    [bulletinsData],
  );

  const handleExport = useCallback(async () => {
    setExporting(true);
    setExportProgress('Cargando KPIs...');
    try {
      const [{ default: FullExportPDF }, { pdf }] = await Promise.all([
        import('@/components/FullExportPDF'),
        import('@react-pdf/renderer'),
      ]);

      const kpisRes = await fetchSafe(() => getDashboardKPIs(), []);

      setExportProgress('Cargando patentes...');
      const patentsRes = await fetchSafe(() => getPatents(1, 50), { items: [], total: 0, page: 1, per_page: 50, total_pages: 0 });

      setExportProgress('Cargando tecnologías...');
      const techRes = await fetchSafe(() => getTechnologies(1, 50), { items: [], total: 0, page: 1, per_page: 50, total_pages: 0 });

      setExportProgress('Cargando organizaciones...');
      const orgsRes = await fetchSafe(() => getOrganizations(1, 50), { items: [], total: 0, page: 1, per_page: 50, total_pages: 0 });

      setExportProgress('Cargando regulaciones...');
      const regsRes = await fetchSafe(() => getRegulations(1, 50), { items: [], total: 0, page: 1, per_page: 50, total_pages: 0 });

      setExportProgress('Cargando indicadores...');
      const indicsRes = await fetchSafe(() => getIndicators(1, 50), { items: [], total: 0, page: 1, per_page: 50, total_pages: 0 });

      setExportProgress('Cargando alertas...');
      const alertsRes = await fetchSafe(() => listAlerts(false, 1, 50), { items: [], total: 0, page: 1, per_page: 50, total_pages: 0 });

      setExportProgress('Cargando boletines...');
      const bullsRes = await fetchSafe(() => listBulletins(1, 50), { items: [], total: 0, page: 1, per_page: 50, total_pages: 0 });

      setExportProgress('Cargando sectores...');
      const sectorsRes = await fetchSafe(() => getIndustrialSectors(1, 100), { items: [], total: 0, page: 1, per_page: 100, total_pages: 0 });

      setExportProgress('Cargando timeline...');
      const timelineRes = await fetchSafe(() => getTimelineEvents(), []);

      const loaded = [patentsRes, techRes, orgsRes, regsRes, indicsRes, alertsRes, bullsRes, sectorsRes]
        .filter((r) => r.items.length > 0).length;
      if (loaded === 0) {
        setExportProgress('Sin datos disponibles. Verifica la conexión.');
        setTimeout(() => setExportProgress(''), 3000);
        return;
      }

      setExportProgress('Generando PDF...');
      const blob = await pdf(
        <FullExportPDF
          kpis={kpisRes}
          patents={patentsRes.items}
          technologies={techRes.items}
          organizations={orgsRes.items}
          regulations={regsRes.items}
          indicators={indicsRes.items}
          alerts={alertsRes.items}
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
      setExportProgress('');
    } catch {
      setExportProgress('Error al generar PDF');
      setTimeout(() => setExportProgress(''), 3000);
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
              {exporting ? exportProgress || 'Exportando...' : 'Exportar'}
            </Button>
            <Button className="gap-2" onClick={() => navigate('/alerts')}>
              <Plus className="h-4 w-4" />
              Nueva Alerta
            </Button>
          </div>
        }
      />

      {sectorsError ? (
        <div className="text-center text-danger py-4">Error al cargar sectores</div>
      ) : sectorsLoading ? (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-28 rounded-full" />
          ))}
        </div>
      ) : (
        <SectorPills sectors={sectors} active={activeSectors} onChange={setActiveSectors} />
      )}

      {/* Section 2 — KPIs */}
      <section>
        {kpisError ? (
          <div className="text-center text-danger py-8">Error al cargar KPIs</div>
        ) : kpisLoading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {kpiCards.map((kpi) => (
              <KPICard key={kpi.label} {...kpi} />
            ))}
          </div>
        )}
      </section>

      {/* Section 3 — Grafo + Alertas (2fr + 1fr) */}
      <section>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h3 className="text-base font-bold text-foreground mb-3">Grafo de Conocimiento Industrial</h3>
            <SectionErrorBoundary title="Grafo de Conocimiento">
              <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                <KnowledgeGraph height={620} className="rounded-lg border border-border" sectorCodigos={activeSectors.map((s) => s.toUpperCase())} />
              </Suspense>
            </SectionErrorBoundary>
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-foreground">Alertas Recientes</h3>
              <Button variant="link" size="sm" className="text-accent-red gap-1" onClick={() => navigate('/alerts')}>
                <Eye className="h-3.5 w-3.5" />
                Ver todas
              </Button>
            </div>
            {alertsError ? (
              <div className="text-center text-danger py-8">Error al cargar alertas</div>
            ) : alertsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton variant="circle" className="h-8 w-8 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <div className="bg-surface rounded-lg border border-border">
                <EmptyState
                  className="py-10"
                  icon={<AlertTriangle className="h-10 w-10 text-text-muted" />}
                  title="Sin alertas"
                  description="No hay alertas de vigilancia recientes."
                />
              </div>
            ) : (
              <SectionErrorBoundary title="Alertas">
                <AlertList alerts={alerts} />
              </SectionErrorBoundary>
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
              <Button variant="link" size="sm" className="text-accent-red gap-1" onClick={() => navigate('/organizations')}>
                <Eye className="h-3.5 w-3.5" />
                Ver todas
              </Button>
            </div>
            <div className="bg-surface rounded-lg border border-border flex-1">
              {orgsError ? (
                <div className="text-center text-danger py-8">Error al cargar entidades</div>
              ) : orgsLoading ? (
                <div className="p-5">
                  <TableSkeleton rows={3} />
                </div>
              ) : entities.length === 0 ? (
                <EmptyState
                  className="py-10"
                  icon={<Users className="h-10 w-10 text-text-muted" />}
                  title="Sin entidades"
                  description="No hay entidades CTI registradas todavía."
                />
              ) : (
                <SectionErrorBoundary title="Entidades CTI">
                  <EntityTable entities={entities} />
                </SectionErrorBoundary>
              )}
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-foreground">Actividad Reciente</h3>
            </div>
            <div className="bg-surface rounded-lg border border-border p-5 flex-1 mt-3">
              {timelineError ? (
                <div className="text-center text-danger py-8">Error al cargar actividad reciente</div>
              ) : timelineLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton variant="circle" className="h-8 w-8 shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <SectionErrorBoundary title="Actividad Reciente">
                  <DashboardTimeline events={timelineEvents.slice(0, 6)} />
                </SectionErrorBoundary>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Section 5 — Productos de Inteligencia (3 columnas) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-foreground">Productos de Inteligencia</h3>
          <Button variant="link" size="sm" className="text-accent-red gap-1" onClick={() => navigate('/bulletins')}>
            <Eye className="h-3.5 w-3.5" />
            Ver todos
          </Button>
        </div>
        {bulletinsError ? (
          <div className="text-center text-danger py-8">Error al cargar productos</div>
        ) : bulletinsLoading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-surface rounded-lg border border-border">
            <EmptyState
              className="py-10"
              icon={<BookOpen className="h-10 w-10 text-text-muted" />}
              title="Sin productos de inteligencia"
              description="Aún no se han publicado boletines ni estudios."
            />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.title} {...product} />
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
          <span className="font-mono">v{import.meta.env.VITE_APP_VERSION || '0.5.0'}</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-dot" />
            {/* TODO: conectar al timestamp real del endpoint de health cuando exista */}
            Última sincronización: en tiempo real
          </span>
        </div>
      </footer>
    </div>
  );
}
