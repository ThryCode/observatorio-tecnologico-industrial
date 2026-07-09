import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Briefcase, Building2, Calendar } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  const details = [
    { label: 'Nombre completo', value: user.full_name, icon: User },
    { label: 'Correo electrónico', value: user.email, icon: Mail },
    { label: 'Teléfono', value: user.phone || '-', icon: Phone },
    { label: 'Cargo', value: user.job_title || '-', icon: Briefcase },
    { label: 'Organización', value: user.organization_id || '-', icon: Building2 },
    { label: 'Miembro desde', value: formatDate(user.created_at), icon: Calendar },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Perfil</h2>
        <p className="text-muted-foreground">Información de tu cuenta de usuario.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{user.full_name}</CardTitle>
              <div className="mt-1 flex items-center gap-2">
                <Badge>{user.role.replace('_', ' ')}</Badge>
                {user.is_superuser && <Badge variant="default">Superusuario</Badge>}
                <Badge variant={user.is_active ? 'success' : 'secondary'}>
                  {user.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {details.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
