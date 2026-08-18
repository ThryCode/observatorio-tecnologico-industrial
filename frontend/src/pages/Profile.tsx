import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import client from '@/api/client';
import { useMyProfessionalProfile, useUpdateMyProfessionalProfile } from '@/hooks/useProfessionals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, Briefcase, Calendar, Save, GraduationCap } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

export default function Profile() {
  const { user, loginSuccess } = useAuth();
  const { t } = useLanguage();

  const isProfessional = user?.role === 'profesional';
  const { data: profProfile, isLoading: profLoading } = useMyProfessionalProfile();

  const userForm = useForm({ defaultValues: { full_name: '', phone: '', job_title: '' } });
  const profForm = useForm({
    defaultValues: {
      especialidad: '',
      grado_cientifico: '',
      biografia: '',
      cv_url: '',
      linkedin_url: '',
      twitter_url: '',
      researchgate_url: '',
      orcid: '',
    },
  });

  useEffect(() => {
    if (user) {
      userForm.reset({
        full_name: user.full_name || '',
        phone: user.phone || '',
        job_title: user.job_title || '',
      });
    }
  }, [user, userForm.reset]);

  useEffect(() => {
    if (profProfile) {
      profForm.reset({
        especialidad: profProfile.especialidad || '',
        grado_cientifico: profProfile.grado_cientifico || '',
        biografia: profProfile.biografia || '',
        cv_url: profProfile.cv_url || '',
        linkedin_url: profProfile.linkedin_url || '',
        twitter_url: profProfile.twitter_url || '',
        researchgate_url: profProfile.researchgate_url || '',
        orcid: profProfile.orcid || '',
      });
    }
  }, [profProfile, profForm.reset]);

  const userMutation = useMutation({
    mutationFn: async (data: { full_name: string; phone: string; job_title: string }) => {
      const res = await client.put('/auth/me', data);
      return res.data;
    },
    onSuccess: async () => {
      toast.success(t('page.profile.actualizadoCorrectamente'));
      const token = localStorage.getItem('token');
      if (token) await loginSuccess(token);
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error(t('page.profile.errorActualizar'));
      }
    },
  });

  const profMutation = useUpdateMyProfessionalProfile();

  const onUserSubmit = (data: { full_name: string; phone: string; job_title: string }) => {
    userMutation.mutate(data);
  };

  const onProfSubmit = (data: {
    especialidad: string;
    grado_cientifico: string;
    biografia: string;
    cv_url: string;
    linkedin_url: string;
    twitter_url: string;
    researchgate_url: string;
    orcid: string;
  }) => {
    const payload: Record<string, string | undefined> = {};
    if (data.especialidad) payload.especialidad = data.especialidad;
    if (data.grado_cientifico) payload.grado_cientifico = data.grado_cientifico;
    if (data.biografia) payload.biografia = data.biografia;
    if (data.cv_url) payload.cv_url = data.cv_url;
    if (data.linkedin_url) payload.linkedin_url = data.linkedin_url;
    if (data.twitter_url) payload.twitter_url = data.twitter_url;
    if (data.researchgate_url) payload.researchgate_url = data.researchgate_url;
    if (data.orcid) payload.orcid = data.orcid;
    profMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(t('page.profile.perfilActualizado'));
      },
      onError: (error) => {
        if (error instanceof AxiosError && error.response?.data?.detail) {
          toast.error(error.response.data.detail);
        } else {
          toast.error(t('page.profile.errorPerfil'));
        }
      },
    });
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('page.profile.title')}</h2>
        <p className="text-muted-foreground">{t('page.profile.description')}</p>
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
          <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('settings.profile.email')}</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input id="email" value={user.email} disabled className="bg-muted" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">{t('settings.profile.fullName')}</Label>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <Input id="full_name" {...userForm.register('full_name')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">{t('settings.profile.phone')}</Label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <Input id="phone" placeholder="+53 5555 5555" {...userForm.register('phone')} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_title">{t('settings.profile.jobTitle')}</Label>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <Input id="job_title" {...userForm.register('job_title')} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {t('page.profile.miembroDesde')} {formatDate(user.created_at)}
            </div>

            <Button type="submit" className="w-full" disabled={userMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {userMutation.isPending ? t('page.profile.guardando') : t('page.profile.guardarCambios')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isProfessional && profLoading && (
        <Card>
          <CardContent className="py-6">
            <TableSkeleton rows={3} />
          </CardContent>
        </Card>
      )}

      {isProfessional && profProfile && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">{t('page.profile.perfilProfesional')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={profForm.handleSubmit(onProfSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="especialidad">{t('page.profile.especialidad')}</Label>
                  <Input id="especialidad" placeholder={t('page.profile.especialidadPlaceholder')} {...profForm.register('especialidad')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grado_cientifico">{t('page.profile.gradoCientifico')}</Label>
                  <Input id="grado_cientifico" placeholder={t('page.profile.gradoCientificoPlaceholder')} {...profForm.register('grado_cientifico')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cv_url">{t('page.profile.urlCv')}</Label>
                <Input id="cv_url" placeholder="https://..." {...profForm.register('cv_url')} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin_url">{t('page.profile.linkedin')}</Label>
                  <Input id="linkedin_url" placeholder="https://linkedin.com/in/..." {...profForm.register('linkedin_url')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter_url">{t('page.profile.twitter')}</Label>
                  <Input id="twitter_url" placeholder="https://x.com/..." {...profForm.register('twitter_url')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="researchgate_url">{t('page.profile.researchgate')}</Label>
                  <Input id="researchgate_url" placeholder="https://researchgate.net/profile/..." {...profForm.register('researchgate_url')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orcid">{t('page.profile.orcid')}</Label>
                  <Input id="orcid" placeholder="0000-0000-0000-0000" {...profForm.register('orcid')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="biografia">{t('page.profile.biografia')}</Label>
                <textarea
                  id="biografia"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder={t('page.profile.biografiaPlaceholder')}
                  {...profForm.register('biografia')}
                />
              </div>

              <Button type="submit" className="w-full" disabled={profMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {profMutation.isPending ? t('page.profile.guardando') : t('page.profile.guardarPerfil')}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
