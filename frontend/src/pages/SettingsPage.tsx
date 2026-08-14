import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import client from '@/api/client';
import { queryKeys } from '@/lib/queryKeys';
import type { TranslationKey } from '@/i18n/translations';
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

const serviceLabels: Record<string, TranslationKey> = {
  database: 'settings.system.database',
  neo4j: 'settings.system.graph',
  redis: 'settings.system.cache',
};

export default function SettingsPage() {
  const { user, loginSuccess } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

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
      toast.success(t('settings.profile.updated'));
      const token = localStorage.getItem('token');
      if (token) await loginSuccess(token);
    },
    onError: (error) => {
      let message = t('settings.profile.updateError');
      if (error instanceof AxiosError && error.response?.data?.detail) {
        message = error.response.data.detail;
      }
      toast.error(message);
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: { email_notifications?: boolean; summary_frequency?: 'diario' | 'semanal' | 'mensual' }) => {
      const res = await client.put('/auth/me', data);
      return res.data;
    },
    onSuccess: async () => {
      toast.success(t('settings.profile.updated'));
      const token = localStorage.getItem('token');
      if (token) await loginSuccess(token);
    },
    onError: (error) => {
      let message = t('settings.profile.updateError');
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

  const statusLabel = health?.status === 'healthy' ? t('settings.system.status.ok') : health ? t('settings.system.status.degraded') : t('settings.system.status.unverified');
  const statusClass = health?.status === 'healthy' ? 'text-success font-semibold' : health ? 'text-destructive font-semibold' : 'text-text-muted';

  const serviceStatusLabel = (service: { status: string }) => {
    if (service.status === 'ok') return { label: t('settings.system.status.ok'), cls: 'text-success' };
    if (service.status === 'unavailable') return { label: t('settings.system.status.unavailable'), cls: 'text-text-muted' };
    return { label: t('settings.system.status.error'), cls: 'text-destructive' };
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('settings.title')}
        highlight={t('settings.highlight')}
        description={t('settings.description')}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-lg border border-border p-6">
            <h3 className="text-base font-bold text-foreground mb-1">{t('settings.profile.title')}</h3>
            <p className="text-sm text-text-muted mb-4">{t('settings.profile.subtitle')}</p>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="settings-email">{t('settings.profile.email')}</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {/* TODO: backend no permite modificar el email (PUT /auth/me solo acepta full_name, phone, job_title) */}
                  <Input id="settings-email" value={user?.email || ''} disabled className="bg-muted" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-full_name">{t('settings.profile.fullName')}</Label>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <Input id="settings-full_name" placeholder={t('settings.profile.fullNamePlaceholder')} {...form.register('full_name')} />
                </div>
                {form.formState.errors.full_name && (
                  <p className="text-xs text-danger">{t('settings.profile.fullNameRequired')}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="settings-phone">{t('settings.profile.phone')}</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <Input id="settings-phone" placeholder={t('settings.profile.phonePlaceholder')} {...form.register('phone')} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settings-job_title">{t('settings.profile.jobTitle')}</Label>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <Input id="settings-job_title" placeholder={t('settings.profile.jobTitlePlaceholder')} {...form.register('job_title')} />
                  </div>
                </div>
              </div>
              <Button type="submit" className="gap-2" disabled={updateProfileMutation.isPending}>
                <Save className="h-4 w-4" />
                {updateProfileMutation.isPending ? t('settings.profile.saving') : t('settings.profile.save')}
              </Button>
            </form>
          </div>

          <div className="bg-surface rounded-lg border border-border p-6">
            <h3 className="text-base font-bold text-foreground mb-1">{t('settings.preferences.title')}</h3>
            <p className="text-sm text-text-muted mb-4">{t('settings.preferences.subtitle')}</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{t('settings.preferences.appearance')}</p>
                  <p className="text-xs text-text-muted">{t('settings.preferences.appearanceDesc')}</p>
                </div>
                <select
                  className="bg-background border border-border rounded-md px-3 py-1.5 text-sm text-foreground"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                >
                  <option value="light">{t('settings.preferences.theme.light')}</option>
                  <option value="dark">{t('settings.preferences.theme.dark')}</option>
                  <option value="system">{t('settings.preferences.theme.system')}</option>
                </select>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-border-subtle">
                <div>
                  <p className="text-sm font-medium text-foreground">{t('settings.preferences.language')}</p>
                  <p className="text-xs text-text-muted">{t('settings.preferences.languageDesc')}</p>
                </div>
                <select
                  className="bg-background border border-border rounded-md px-3 py-1.5 text-sm text-foreground"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'es' | 'en')}
                >
                  <option value="es">{t('settings.preferences.language.es')}</option>
                  <option value="en">{t('settings.preferences.language.en')}</option>
                </select>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-border-subtle">
                <div>
                  <p className="text-sm font-medium text-foreground">{t('settings.preferences.emailNotifications')}</p>
                  <p className="text-xs text-text-muted">{t('settings.preferences.emailNotificationsDesc')}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={user?.email_notifications ?? true}
                    disabled={updatePreferencesMutation.isPending}
                    onChange={(e) => updatePreferencesMutation.mutate({ email_notifications: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-border-subtle rounded-full peer peer-checked:bg-accent-orange peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                </label>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-border-subtle">
                <div>
                  <p className="text-sm font-medium text-foreground">{t('settings.preferences.summaryFrequency')}</p>
                  <p className="text-xs text-text-muted">{t('settings.preferences.summaryFrequencyDesc')}</p>
                </div>
                <select
                  className="bg-background border border-border rounded-md px-3 py-1.5 text-sm text-foreground"
                  value={user?.summary_frequency ?? 'diario'}
                  disabled={updatePreferencesMutation.isPending}
                  onChange={(e) => updatePreferencesMutation.mutate({ summary_frequency: e.target.value as 'diario' | 'semanal' | 'mensual' })}
                >
                  <option value="diario">{t('settings.preferences.frequency.daily')}</option>
                  <option value="semanal">{t('settings.preferences.frequency.weekly')}</option>
                  <option value="mensual">{t('settings.preferences.frequency.monthly')}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-lg border border-border p-6">
            <h3 className="text-base font-bold text-foreground mb-1">{t('settings.sources.title')}</h3>
            <p className="text-sm text-text-muted mb-4">{t('settings.sources.subtitle')}</p>
            <div className="space-y-3">
              {['Oficina Cubana de Propiedad Industrial (OCPI)', 'Gaceta Oficial de Cuba', 'ONEI', 'WIPO Patent Database', 'SciELO Cuba'].map((source) => (
                <div key={source} className="flex items-center justify-between py-2">
                  <span className="text-sm text-foreground">{source}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-success-bg text-success">{t('settings.sources.active')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-lg border border-border p-6">
            <h3 className="text-base font-bold text-foreground mb-1">{t('settings.system.title')}</h3>
            <p className="text-sm text-text-muted mb-4">{t('settings.system.subtitle')}</p>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">{t('settings.system.version')}</span>
                <span className="font-mono text-foreground">{import.meta.env.VITE_APP_VERSION || '0.1.0'}</span>
              </div>
              {Object.entries(serviceLabels).map(([key, label]) => {
                const service = health?.services?.[key];
                if (!service) return null;
                const { label: statusText, cls } = serviceStatusLabel(service);
                return (
                  <div key={key} className="flex justify-between">
                    <span className="text-text-muted">{t(label)}</span>
                    <span className={cls}>{statusText}</span>
                  </div>
                );
              })}
              <div className="flex justify-between py-2 border-t border-border-subtle">
                <span className="text-text-muted">{t('settings.system.status')}</span>
                <span className={statusClass}>{statusLabel}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-lg border border-border p-6">
            <h3 className="text-base font-bold text-foreground mb-1">{t('settings.security.title')}</h3>
            <p className="text-sm text-text-muted mb-4">{t('settings.security.subtitle')}</p>
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Key className="h-4 w-4" />
              {/* TODO: backend no expone endpoint de cambio de contraseña ni gestión de sesiones/logs */}
              {t('settings.security.unavailable')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
