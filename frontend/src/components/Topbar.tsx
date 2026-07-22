import { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Search,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  Home,
} from 'lucide-react';

const routeNames: Record<string, string> = {
  '/': 'Dashboard',
  '/graph': 'Grafo de Conocimiento',
  '/patents': 'Patentes',
  '/publications': 'Publicaciones',
  '/alerts': 'Alertas',
  '/bulletins': 'Boletines',
  '/competitiveness': 'Análisis de Competitividad',
  '/patent-maps': 'Mapas de Patentes',
  '/organizations': 'Entidades CTI',
  '/network': 'Red Profesional',
  '/settings': 'Configuración',
  '/profile': 'Perfil',
};

export default function Topbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const [notifCount] = useState(3);

  // Keyboard shortcut: Cmd+K / Ctrl+K to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Build breadcrumbs from path
  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = [{ path: '/', label: 'Inicio' }];
  let currentPath = '';
  for (const part of pathParts) {
    currentPath += `/${part}`;
    breadcrumbs.push({ path: currentPath, label: routeNames[currentPath] || part });
  }

  const roleLabels: Record<string, string> = {
    admin_mindus: 'Administrador MINDUS',
    rep_cti: 'Representante CTI',
    analista: 'Analista',
    cliente: 'Cliente',
    visitante: 'Visitante',
  };

  return (
    <header className="sticky top-0 z-20 h-topbar bg-white/92 backdrop-blur-[12px] saturate-[180%] border-b border-border">
      <div className="flex items-center justify-between h-full px-8">
        {/* Breadcrumbs */}
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

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative" ref={searchRef as unknown as React.RefObject<HTMLDivElement>}>
            <div className={cn(
              'relative flex items-center transition-all duration-250',
              searchOpen ? 'w-[320px]' : 'w-[200px] lg:w-[320px]',
            )}>
              <Search className="absolute left-3.5 h-4 w-4 text-text-muted pointer-events-none" />
              <input
                type="search"
                placeholder="Buscar patentes, entidades, tecnologías..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => !searchQuery && setSearchOpen(false)}
                className={cn(
                  'w-full h-10 rounded-full border border-border bg-background pl-10 pr-12 text-sm text-foreground placeholder:text-text-placeholder outline-none transition-all duration-150',
                  searchOpen && 'border-accent-orange shadow-[0_0_0_3px_hsl(var(--accent-subtle))] shadow-sm',
                )}
                aria-label="Buscar en el observatorio"
              />
              <kbd className="absolute right-3 hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-text-muted bg-surface border border-border rounded-sm">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Notifications */}
          <button className="relative w-10 h-10 rounded-full border border-border bg-surface text-text-secondary hover:bg-background hover:border-accent-orange hover:text-accent-orange hover:-translate-y-0.5 transition-all duration-150 flex items-center justify-center" aria-label="Notificaciones" title="Notificaciones">
            <Bell className="h-4 w-4" />
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-accent-orange text-white text-[10px] font-bold flex items-center justify-center border-2 border-surface">
                {notifCount}
              </span>
            )}
          </button>

          {/* Settings */}
          <button className="w-10 h-10 rounded-full border border-border bg-surface text-text-secondary hover:bg-background hover:border-accent-orange hover:text-accent-orange hover:-translate-y-0.5 transition-all duration-150 flex items-center justify-center" aria-label="Configuración" title="Configuración">
            <Settings className="h-4 w-4" />
          </button>

          {/* Divider */}
          <div className="h-8 w-px bg-border mx-1" />

          {/* User info */}
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <span className="text-sm font-medium text-foreground">{user?.full_name || user?.username}</span>
            <span className="rounded-full bg-accent-subtle text-accent-orange px-2.5 py-0.5 text-[11px] font-semibold">
              {roleLabels[user?.role || ''] || user?.role}
            </span>
          </div>

          {/* Logout */}
          <Button variant="ghost" size="icon" onClick={logout} title="Cerrar sesión" className="text-text-muted hover:text-accent-orange">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
