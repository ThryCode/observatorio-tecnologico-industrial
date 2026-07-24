import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { AxiosError } from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import client from '@/api/client';
import { useMyProfessionalProfile, useUpdateMyProfessionalProfile } from '@/hooks/useProfessionals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, Briefcase, Calendar, Save, GraduationCap } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

export default function Profile() {
  const { user, loginSuccess } = useAuth();
  const queryClient = useQueryClient();
  const [userError, setUserError] = useState<string | null>(null);
  const [profError, setProfError] = useState<string | null>(null);
  const [userSuccess, setUserSuccess] = useState(false);
  const [profSuccess, setProfSuccess] = useState(false);

  const isProfessional = user?.account_type === 'profesional';
  const { data: profProfile, isLoading: profLoading } = useMyProfessionalProfile();

  const userForm = useForm({ defaultValues: { full_name: '', phone: '', job_title: '' } });
  const profForm = useForm({
    defaultValues: { especialidad: '', grado_cientifico: '', biografia: '', cv_url: '' },
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
      });
    }
  }, [profProfile, profForm.reset]);

  const userMutation = useMutation({
    mutationFn: async (data: { full_name: string; phone: string; job_title: string }) => {
      const res = await client.put('/auth/me', data);
      return res.data;
    },
    onSuccess: async () => {
      setUserSuccess(true);
      setUserError(null);
      const token = localStorage.getItem('token');
      if (token) await loginSuccess(token);
    },
    onError: (error) => {
      setUserSuccess(false);
      if (error instanceof AxiosError && error.response?.data?.detail) {
        setUserError(error.response.data.detail);
      } else {
        setUserError('Error al actualizar perfil.');
      }
    },
  });

  const profMutation = useUpdateMyProfessionalProfile();

  const onUserSubmit = (data: { full_name: string; phone: string; job_title: string }) => {
    setUserSuccess(false);
    setUserError(null);
    userMutation.mutate(data);
  };

  const onProfSubmit = (data: { especialidad: string; grado_cientifico: string; biografia: string; cv_url: string }) => {
    setProfSuccess(false);
    setProfError(null);
    const payload: Record<string, string | undefined> = {};
    if (data.especialidad) payload.especialidad = data.especialidad;
    if (data.grado_cientifico) payload.grado_cientifico = data.grado_cientifico;
    if (data.biografia) payload.biografia = data.biografia;
    if (data.cv_url) payload.cv_url = data.cv_url;
    profMutation.mutate(payload, {
      onSuccess: () => {
        setProfSuccess(true);
        setProfError(null);
      },
      onError: (error) => {
        setProfSuccess(false);
        if (error instanceof AxiosError && error.response?.data?.detail) {
          setProfError(error.response.data.detail);
        } else {
          setProfError('Error al actualizar perfil profesional.');
        }
      },
    });
  };

  if (!user) return null;

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
          <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input id="email" value={user.email} disabled className="bg-muted" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre completo</Label>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <Input id="full_name" {...userForm.register('full_name')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <Input id="phone" placeholder="+53 5555 5555" {...userForm.register('phone')} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_title">Cargo</Label>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <Input id="job_title" {...userForm.register('job_title')} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Miembro desde {formatDate(user.created_at)}
            </div>

            {userError && <p className="text-sm text-red-500">{userError}</p>}
            {userSuccess && <p className="text-sm text-green-500">Perfil actualizado correctamente.</p>}

            <Button type="submit" className="w-full" disabled={userMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {userMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isProfessional && profLoading && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">Cargando perfil profesional...</CardContent>
        </Card>
      )}

      {isProfessional && profProfile && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Perfil Profesional</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={profForm.handleSubmit(onProfSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="especialidad">Especialidad</Label>
                  <Input id="especialidad" placeholder="Biotecnología, Energía, etc." {...profForm.register('especialidad')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grado_cientifico">Grado científico</Label>
                  <Input id="grado_cientifico" placeholder="Dr.C., MSc., Ing." {...profForm.register('grado_cientifico')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cv_url">URL del CV (opcional)</Label>
                <Input id="cv_url" placeholder="https://..." {...profForm.register('cv_url')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="biografia">Biografía</Label>
                <textarea
                  id="biografia"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Breve descripción de su trayectoria profesional..."
                  {...profForm.register('biografia')}
                />
              </div>

              {profError && <p className="text-sm text-red-500">{profError}</p>}
              {profSuccess && <p className="text-sm text-green-500">Perfil profesional actualizado correctamente.</p>}

              <Button type="submit" className="w-full" disabled={profMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {profMutation.isPending ? 'Guardando...' : 'Guardar perfil profesional'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
