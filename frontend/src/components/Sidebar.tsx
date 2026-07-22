import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Share2,
  UserCircle,
  ClipboardCheck,
  FileText,
  Newspaper,
  Bell,
  BookOpen,
  BarChart3,
  Map,
  Building2,
  Users,
  Settings,
  ChevronRight,
  Menu,
  X,
  AlertTriangle,
} from 'lucide-react';

const mainNav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/graph', label: 'Grafo de Conocimiento', icon: Share2 },
  { to: '/patents', label: 'Patentes', icon: FileText, badge: '1.2k' },
  { to: '/publications', label: 'Publicaciones', icon: Newspaper },
];

const intelligenceNav = [
  { to: '/alerts', label: 'Alertas', icon: Bell, badge: '7', badgeVariant: 'danger' as const },
  { to: '/bulletins', label: 'Boletines', icon: BookOpen },
  { to: '/competitiveness', label: 'Análisis de Competitividad', icon: BarChart3 },
  { to: '/patent-maps', label: 'Mapas de Patentes', icon: Map },
];

const orgNav = [
  { to: '/organizations', label: 'Entidades CTI', icon: Building2 },
  { to: '/network', label: 'Red Profesional', icon: Users },
  { to: '/settings', label: 'Configuración', icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const initials = user?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AD';

  const roleLabels: Record<string, string> = {
    admin_mindus: 'Administrador MINDUS',
    rep_cti: 'Representante CTI',
    analista: 'Analista',
    cliente: 'Cliente',
    visitante: 'Visitante',
  };

  const adminNav = user?.is_superuser
    ? [{ to: '/admin/pending', label: 'Solicitudes', icon: ClipboardCheck }]
    : [];

  const sidebarContent = (
    <>
      <div className={cn(
        'flex items-center gap-3 px-4 h-16 border-b border-white/10 shrink-0',
        collapsed && 'justify-center px-2',
      )}>
        <div className="w-9 h-9 rounded-md bg-gradient-to-br from-accent-orange to-gold flex items-center justify-center shadow-glow-orange shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
          </svg>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-[15px] font-bold text-white truncate">Observatorio</h1>
            <p className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">Tecnológico Industrial</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto sidebar-scrollbar px-3 py-4 space-y-6" role="navigation" aria-label="Navegación principal">
        <Section label="Principal" collapsed={collapsed}>
          {mainNav.map((item) => (
            <NavItem
              key={item.to}
              {...item}
              collapsed={collapsed}
              active={isActive(item.to)}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </Section>

        <Section label="Inteligencia" collapsed={collapsed}>
          {intelligenceNav.map((item) => (
            <NavItem
              key={item.to}
              {...item}
              collapsed={collapsed}
              active={isActive(item.to)}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </Section>

        <Section label="Organización" collapsed={collapsed}>
          {[...orgNav, ...adminNav].map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              collapsed={collapsed}
              active={isActive(item.to)}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </Section>
      </nav>

      <div className={cn(
        'shrink-0 p-3 border-t border-white/10',
        collapsed && 'px-2',
      )}>
        <NavLink
          to="/profile"
          onClick={() => setMobileOpen(false)}
          className={cn(
            'flex items-center gap-3 rounded-md p-3 transition-all duration-150',
            collapsed && 'justify-center p-2',
            isActive('/profile')
              ? 'bg-sidebar-active'
              : 'hover:bg-sidebar-hover hover:border hover:border-white/10',
          )}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-orange to-gold flex items-center justify-center shrink-0 text-white text-sm font-bold">
            {initials}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.full_name || user?.username}</p>
                <p className="text-[11px] text-white/50 truncate">{roleLabels[user?.role || ''] || user?.role}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-white/50 transition-transform duration-150 group-hover:rotate-180 shrink-0" />
            </>
          )}
        </NavLink>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-3 left-3 z-50 lg:hidden w-10 h-10 rounded-full bg-sidebar-bg text-white flex items-center justify-center shadow-lg border border-white/10"
        aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col h-screen bg-sidebar-bg border-r border-white/10 fixed left-0 top-0 z-30 transition-all duration-250',
          collapsed ? 'w-sidebar-collapsed' : 'w-sidebar',
        )}
      >
        {sidebarContent}
        {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar-bg border border-white/10 text-white/50 hover:text-white flex items-center justify-center transition-all duration-150 hover:scale-110"
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
          <ChevronRight className={cn('h-3 w-3 transition-transform duration-250', collapsed && 'rotate-180')} />
        </button>
      </aside>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <aside className="fixed inset-y-0 left-0 z-40 w-sidebar bg-sidebar-bg border-r border-white/10 lg:hidden overflow-y-auto">
          {sidebarContent}
        </aside>
      )}
    </>
  );
}

function Section({ label, collapsed, children }: { label: string; collapsed: boolean; children: React.ReactNode }) {
  return (
    <div>
      {!collapsed && (
        <p className="text-[10px] uppercase tracking-wider text-white/35 font-semibold px-1 mb-2">
          {label}
        </p>
      )}
      {children}
    </div>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  badge,
  badgeVariant,
  collapsed,
  active,
  onClick,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: 'danger' | 'default';
  collapsed: boolean;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-3 rounded-md transition-all duration-150 group',
        collapsed ? 'justify-center p-3' : 'px-3 py-3',
        active
          ? 'bg-sidebar-active text-accent-orange font-semibold'
          : 'text-white/70 hover:bg-sidebar-hover hover:text-white',
      )}
      aria-current={active ? 'page' : undefined}
    >
      {active && (
        <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r-full bg-accent-orange shadow-glow-orange" />
      )}
      <Icon className={cn('h-5 w-5 shrink-0', active ? 'text-accent-orange' : 'text-white/70 group-hover:text-white')} />
      {!collapsed && (
        <>
          <span className="text-sm font-medium truncate">{label}</span>
          {badge && (
            <span className={cn(
              'ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
              badgeVariant === 'danger'
                ? 'bg-accent-orange text-white'
                : 'bg-accent-orange/20 text-accent-orange',
            )}>
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}
