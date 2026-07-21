import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Building2,
  FileText,
  BarChart3,
  Scale,
  Share2,
  UserCircle,
  ClipboardCheck,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/organizations', label: 'Organizaciones', icon: Building2 },
  { to: '/patents', label: 'Patentes', icon: FileText },
  { to: '/indicators', label: 'Indicadores', icon: BarChart3 },
  { to: '/regulations', label: 'Normativas', icon: Scale },
  { to: '/graph', label: 'Grafo', icon: Share2 },
];

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-6">
        <h2 className="text-lg font-semibold text-primary">OTI</h2>
        <span className="ml-2 text-xs text-muted-foreground">Observatorio</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
        {user?.is_superuser && (
          <NavLink
            to="/admin/pending"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            <ClipboardCheck className="h-4 w-4" />
            Solicitudes
          </NavLink>
        )}
      </nav>
      <div className="border-t p-4">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )
          }
        >
          <UserCircle className="h-4 w-4" />
          Perfil
        </NavLink>
      </div>
    </aside>
  );
}
