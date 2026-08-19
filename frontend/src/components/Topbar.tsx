import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { roleLabels } from '@/utils/roles';
import { useAlerts } from '@/hooks/useAlerts';
import CommandPalette from '@/components/CommandPalette';
import type { TranslationKey } from '@/i18n/translations';
import {
  Search,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  Home,
} from 'lucide-react';

function breadcrumbLabel(routeNames: Record<string, string>, route: string, part: string): string {
  const mapped = routeNames[route];
  if (mapped) return mapped;
  if (route === '/admin/pending') return routeNames['/admin/pending'] || part;
  return part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
}

export default function Topbar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifClicked, setNotifClicked] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const { data: upcomingAlerts } = useAlerts(false, 1, 1, undefined, undefined, undefined, today);
  const rawCount = upcomingAlerts?.items.length ?? 0;
  const lastSeen = parseInt(localStorage.getItem('lastAlertUpcomingCount') ?? '-1', 10);
  const notifCount = notifClicked ? 0 : (lastSeen === -1 ? rawCount : Math.max(0, rawCount - lastSeen));

  const routeNames: Record<string, string> = {
    '/': t('sidebar.dashboard'),
    '/graph': t('sidebar.grafoConocimiento'),
    '/technologies': t('sidebar.tecnologias'),
    '/patents': t('sidebar.patentes'),
    '/indicators': t('page.indicators.title'),
    '/publications': t('sidebar.publicaciones'),
    '/regulations': t('page.regulations.title' as TranslationKey),
    '/alerts': t('sidebar.alertas'),
    '/bulletins': t('sidebar.boletines'),
    '/competitiveness': t('sidebar.analisisCompetitividad'),
    '/patent-maps': t('sidebar.mapasPatentes'),
    '/organizations': t('sidebar.entidadesCti'),
    '/network': t('sidebar.redProfesional'),
    '/mi-empresa': t('sidebar.miEmpresa'),
    '/enterprise-graph': t('sidebar.grafoEmpresarial'),
    '/graph-analytics': t('page.graphAnalytics.title'),
    '/settings': t('sidebar.configuracion'),
    '/profile': t('page.profile.title'),
    '/admin/pending': t('page.admin.pending.title'),
  };

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = [{ path: '/', label: t('topbar.inicio') }];
  let currentPath = '';
  for (const part of pathParts) {
    currentPath += `/${part}`;
    breadcrumbs.push({ path: currentPath, label: breadcrumbLabel(routeNames, currentPath, part) });
  }

  return (
    <header className="sticky top-0 z-20 h-topbar bg-background/90 backdrop-blur-[12px] saturate-[180%] border-b border-border">
      <div className="flex items-center justify-between h-full px-8">
        <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.path} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-border-strong" />}
              {i === breadcrumbs.length - 1 ? (
                <span className="text-foreground font-semibold" aria-current="page">{crumb.label}</span>
              ) : (
                <Link to={crumb.path} className="text-text-muted hover:text-text-secondary transition-colors">
                  {i === 0 ? <Home className="h-4 w-4" /> : crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-2 h-9 rounded-full border-border bg-surface text-text-secondary hover:bg-background hover:border-accent-red hover:text-accent-red transition-all duration-150"
            onClick={() => setPaletteOpen(true)}
          >
            <Search className="h-4 w-4" />
            <span className="hidden lg:inline text-muted-foreground text-sm">{t('topbar.buscar')}</span>
            <kbd className="pointer-events-none ml-1 hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>

          <button onClick={() => { setNotifClicked(true); localStorage.setItem('lastAlertUpcomingCount', String(rawCount)); navigate('/alerts'); }} className="relative w-10 h-10 rounded-full border border-border bg-surface text-text-secondary hover:bg-background hover:border-accent-red hover:text-accent-red hover:-translate-y-0.5 transition-all duration-150 flex items-center justify-center" aria-label={t('topbar.alertas')} title={t('topbar.alertas')}>
            <Bell className="h-4 w-4" />
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-accent-red text-white text-[10px] font-bold flex items-center justify-center border-2 border-surface">
                {notifCount}
              </span>
            )}
          </button>

          <button onClick={() => navigate('/settings')} className="w-10 h-10 rounded-full border border-border bg-surface text-text-secondary hover:bg-background hover:border-accent-red hover:text-accent-red hover:-translate-y-0.5 transition-all duration-150 flex items-center justify-center" aria-label={t('topbar.configuracion')} title={t('topbar.configuracion')}>
            <Settings className="h-4 w-4" />
          </button>

          <div className="h-8 w-px bg-border mx-1" />

          <div className="hidden sm:flex items-center gap-2 text-sm">
            <span className="text-sm font-medium text-foreground">{user?.full_name || user?.username}</span>
            <span className="rounded-full bg-accent-subtle text-accent-red px-2.5 py-0.5 text-[11px] font-semibold">
              {roleLabels[user?.role || ''] || user?.role}
            </span>
          </div>

          <Button variant="ghost" size="icon" onClick={logout} title={t('topbar.cerrarSesion')} className="text-text-muted hover:text-accent-red">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}
