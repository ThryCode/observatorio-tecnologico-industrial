import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import client from '@/api/client';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Key, User, Phone, Briefcase, Mail } from 'lucide-react';

const profileSchema = z.object({
  full_name: z.string().min(1, 'El nombre es requerido'),
  phone: z.string().optional(),
  job_title: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface HealthResponse {
  status: string;
  services: Record<string, { status: string }>;
}

const serviceLabels: Record<string, string> = {
  database: 'Base de datos (SQLite)',
  neo4j: 'Grafo (Neo4j 5.26)',
  redis: 'Cache (Redis 5.0)',
};

export default function SettingsPage() {
  const { user, loginSuccess } = useAuth();

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      job_title: user?.job_title || '',
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const res = await client.put('/auth/me', data);
      return res.data;
    },
    onSuccess: async () => {
      toast.success('Perfil actualizado correctamente');
      const token = localStorage.getItem('token');
      if (token) await loginSuccess(token);
    },
    onError: (error) => {
      let message = 'No se pudo actualizar el perfil';
      if (error instanceof AxiosError && error.response?.data?.detail) {
        message = error.response.data.detail;
      }
      toast.error(message);
    },
  });

  const { data: health } = useQuery({
    queryKey: queryKeys.health(),
    queryFn: async () => {
      const res = await client.get<HealthResponse>('/health');
      return res.data;
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    retry: false,
  });

  const onSubmit = (values: ProfileForm) => {
    updateProfileMutation.mutate(values);
  };

  const statusLabel = health?.status === 'healthy' ? 'Operativo' : health ? 'Degradado' : 'No verificado';
  const statusClass = health?.status === 'healthy' ? 'text-success font-semibold' : health ? 'text-destructive font-semibold' : 'text-text-muted';

  const serviceStatusLabel = (service: { status: string }) => {
    if (service.status === 'ok') return { label: 'Operativo', cls: 'text-success' };
    if (service.status === 'unavailable') return { label: 'No disponible', cls: 'text-text-muted' };
    return { label: 'Error', cls: 'text-destructive' };
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración del Sistema"
        highlight="Configuración"
        description="Administración de preferencias, usuarios, fuentes de datos y parámetros del observatorio."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-lg border border-border p-6">
            <h3 className="text-base font-bold text-foreground mb-1">Perfil de Usuario</h3>
            <p className="text-sm text-text-muted mb-4">Datos de tu cuenta de usuario.</p>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="settings-email">Correo electrónico</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {/* TODO: backend no permite modificar el email (PUT /auth/me solo acepta full_name, phone, job_title) */}
                  <Input id="settings-email" value={user?.email || ''} disabled className="bg-muted" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-full_name">Nombre completo *</Label>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <Input id="settings-full_name" placeholder="Nombre completo" {...form.register('full_name')} />
                </div>
                {form.formState.errors.full_name && (
                  <p className="text-xs text-red-500">{form.formState.errors.full_name.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="settings-phone">Teléfono</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <Input id="settings-phone" placeholder="+53 5555 5555" {...form.register('phone')} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settings-job_title">Cargo</Label>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <Input id="settings-job_title" placeholder="Cargo" {...form.register('job_title')} />
                  </div>
                </div>
              </div>
              <Button type="submit" className="gap-2" disabled={updateProfileMutation.isPending}>
                <Save className="h-4 w-4" />
                {updateProfileMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </form>
          </div>

          <div className="bg-surface rounded-lg border border-border p-6">
            <h3 className="text-base font-bold text-foreground mb-1">Preferencias Generales</h3>
            <p className="text-sm text-text-muted mb-4">Configuración de idioma, notificaciones y apariencia.</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Idioma del sistema</p>
                  <p className="text-xs text-text-muted">Idioma predeterminado para la interfaz</p>
                </div>
                <select className="bg-background border border-border rounded-md px-3 py-1.5 text-sm text-foreground">
                  <option>Español</option>
                  <option>English</option>
                </select>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-border-subtle">
                <div>
                  <p className="text-sm font-medium text-foreground">Notificaciones por correo</p>
                  <p className="text-xs text-text-muted">Recibir alertas por correo electrónico</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-border-subtle rounded-full peer peer-checked:bg-accent-orange peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                </label>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-border-subtle">
                <div>
                  <p className="text-sm font-medium text-foreground">Frecuencia de resúmenes</p>
                  <p className="text-xs text-text-muted">Resumen periódico de actividad</p>
                </div>
                <select className="bg-background border border-border rounded-md px-3 py-1.5 text-sm text-foreground">
                  <option>Diario</option>
                  <option>Semanal</option>
                  <option>Mensual</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-lg border border-border p-6">
            <h3 className="text-base font-bold text-foreground mb-1">Fuentes de Datos</h3>
            <p className="text-sm text-text-muted mb-4">Gestión de fuentes para la vigilancia tecnológica.</p>
            <div className="space-y-3">
              {['Oficina Cubana de Propiedad Industrial (OCPI)', 'Gaceta Oficial de Cuba', 'ONEI', 'WIPO Patent Database', 'SciELO Cuba'].map((source) => (
                <div key={source} className="flex items-center justify-between py-2">
                  <span className="text-sm text-foreground">{source}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-success-bg text-success">Activa</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-lg border border-border p-6">
            <h3 className="text-base font-bold text-foreground mb-1">Información del Sistema</h3>
            <p className="text-sm text-text-muted mb-4">Estado y versión del observatorio.</p>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Versión</span>
                <span className="font-mono text-foreground">{import.meta.env.VITE_APP_VERSION || '0.1.0'}</span>
              </div>
              {Object.entries(serviceLabels).map(([key, label]) => {
                const service = health?.services?.[key];
                if (!service) return null;
                const { label: statusText, cls } = serviceStatusLabel(service);
                return (
                  <div key={key} className="flex justify-between">
                    <span className="text-text-muted">{label}</span>
                    <span className={cls}>{statusText}</span>
                  </div>
                );
              })}
              <div className="flex justify-between py-2 border-t border-border-subtle">
                <span className="text-text-muted">Estado</span>
                <span className={statusClass}>{statusLabel}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-lg border border-border p-6">
            <h3 className="text-base font-bold text-foreground mb-1">Seguridad</h3>
            <p className="text-sm text-text-muted mb-4">Gestión de acceso y autenticación.</p>
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Key className="h-4 w-4" />
              {/* TODO: backend no expone endpoint de cambio de contraseña ni gestión de sesiones/logs */}
              Funcionalidad no disponible
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
