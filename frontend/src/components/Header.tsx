import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6">
      <div>
        <h1 className="text-sm font-medium text-muted-foreground">
          Observatorio Tecnológico Industrial
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{user?.full_name || user?.username}</span>
          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
            {user?.role?.replace('_', ' ')}
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} title="Cerrar sesión">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
