import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';

type Entity = 'technologies' | 'organizations' | 'patents' | 'regulations' | 'indicators' | 'alerts' | 'users' | 'settings' | 'research-publications';
type Action = 'create' | 'edit' | 'delete' | 'approve' | 'reject' | 'view';

const PERMISSIONS: Record<UserRole, Partial<Record<Entity, Action[]>>> = {
  admin_mindus: {
    technologies: ['create', 'edit', 'delete'],
    organizations: ['delete'],
    patents: ['create', 'edit', 'delete'],
    regulations: ['create', 'edit', 'delete'],
    indicators: ['create', 'edit', 'delete'],
    alerts: ['create', 'edit', 'delete'],
    'research-publications': ['create', 'edit', 'delete'],
    users: ['approve', 'reject'],
    settings: ['view'],
  },
  rep_cti: {},
  analista: {
    patents: ['create'],
    indicators: ['create'],
  },
  cliente: {},
  visitante: {},
};

export function usePermissions() {
  const { user } = useAuth();
  const role: UserRole = user?.role ?? 'visitante';

  const can = (entity: Entity, action: Action): boolean => {
    const allowed = PERMISSIONS[role]?.[entity];
    return allowed?.includes(action) ?? false;
  };

  return { can, role };
}
