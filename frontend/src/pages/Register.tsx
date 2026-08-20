import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import * as authApi from '@/api/auth';
import type { RegisterRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';

const ESPECIALIDADES = [
  'Biotecnología',
  'Energía',
  'Electrónica',
  'Metalurgia',
  'Química',
  'Industria Alimentaria',
  'Telecomunicaciones',
  'Automatización',
  'Medio Ambiente',
  'Nanotecnología',
  'Otro',
];

const registerSchema = z
  .object({
    role: z.enum(['representante', 'analista', 'profesional'], {
      required_error: 'Seleccione un tipo de cuenta',
    }),
    username: z
      .string()
      .min(3, 'El usuario debe tener al menos 3 caracteres')
      .max(50)
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        'Solo letras, números, guiones o guiones bajos',
      ),
    email: z.string().email('Correo electrónico inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string(),
    full_name: z.string().min(1, 'Nombre completo requerido'),
    phone: z.string().optional(),
    especialidad: z.string().optional(),
    especialidad_custom: z.string().optional(),
    grado_cientifico: z.string().optional(),
    linkedin_url: z.string().url('URL inválida').optional().or(z.literal('')),
    twitter_url: z.string().url('URL inválida').optional().or(z.literal('')),
    researchgate_url: z.string().url('URL inválida').optional().or(z.literal('')),
    orcid: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      if (data.role === 'profesional') {
        if (!data.especialidad) return false;
        if (data.especialidad === 'Otro' && !data.especialidad_custom?.trim()) return false;
      }
      return true;
    },
    {
      message: 'Especialidad requerida',
      path: ['especialidad'],
    },
  );

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const { t } = useLanguage();
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authApi.registerPublic(data),
    onSuccess: () => setSuccess(true),
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.data?.detail) {
        setServerError(error.response.data.detail);
      } else {
        setServerError(t('register.errorGeneric'));
      }
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const accountType = watch('role');

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {t('register.successTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              {t('register.successMessage')}
            </p>
            <Link to="/login">
              <Button variant="outline" className="w-full">
                {t('register.backToLogin')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onSubmit = (data: RegisterForm) => {
    setServerError(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, especialidad_custom, ...payload } = data;
    const finalEspecialidad = payload.especialidad === 'Otro' && especialidad_custom?.trim()
      ? especialidad_custom.trim()
      : payload.especialidad;
    registerMutation.mutate({
      ...payload,
      especialidad: finalEspecialidad,
      username: payload.username.toLowerCase(),
    } as RegisterRequest);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {t('register.title')}
          </CardTitle>
          <CardDescription>
            {t('register.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('register.accountTypeLabel')}</Label>
              <Select
                value={accountType}
                onValueChange={(v) =>
                  setValue('role', v as 'representante' | 'analista' | 'profesional')
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('register.selectPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="representante">
                    {t('register.roleRepresentante')}
                  </SelectItem>
                  <SelectItem value="analista">{t('register.roleAnalista')}</SelectItem>
                  <SelectItem value="profesional">
                    {t('register.roleProfesional')}
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-xs text-danger">
                  {errors.role.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">{t('register.usernameLabel')}</Label>
                <Input
                  id="username"
                  placeholder="mi_usuario"
                  {...register('username')}
                />
                {errors.username && (
                  <p className="text-xs text-danger">
                    {errors.username.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('register.emailLabel')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@mindus.gob.cu"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-danger">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">{t('register.fullNameLabel')}</Label>
              <Input
                id="full_name"
                placeholder="Juan Pérez García"
                {...register('full_name')}
              />
              {errors.full_name && (
                <p className="text-xs text-danger">
                  {errors.full_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t('register.phoneLabel')}</Label>
              <Input
                id="phone"
                placeholder="+53 5555 5555"
                {...register('phone')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">{t('register.passwordLabel')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-danger">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('register.confirmPasswordLabel')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-danger">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            {accountType === 'profesional' && (
              <div className="space-y-4 rounded-md border border-border bg-muted/30 p-4">
                <p className="text-sm font-medium text-foreground">
                  {t('register.professionalInfo')}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('register.specialtyLabel')}</Label>
                    <Select
                      value={watch('especialidad') || ''}
                      onValueChange={(v) => setValue('especialidad', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ESPECIALIDADES.map((e) => (
                          <SelectItem key={e} value={e}>{e}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.especialidad && (
                      <p className="text-xs text-danger">
                        {errors.especialidad.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grado_cientifico">{t('register.scientificDegree')}</Label>
                    <Input
                      id="grado_cientifico"
                      placeholder="Dr.C., MSc., Ing."
                      {...register('grado_cientifico')}
                    />
                  </div>
                </div>
                {watch('especialidad') === 'Otro' && (
                  <div className="space-y-2">
                    <Label htmlFor="especialidad_custom">{t('register.customSpecialtyLabel')}</Label>
                    <Input
                      id="especialidad_custom"
                      placeholder="Ej: Robótica Agrícola"
                      {...register('especialidad_custom', {
                        required: watch('especialidad') === 'Otro' ? 'Escriba su especialidad' : false,
                      })}
                    />
                    {errors.especialidad_custom && (
                      <p className="text-xs text-danger">
                        {errors.especialidad_custom.message}
                      </p>
                    )}
                  </div>
                )}
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">{t('register.socialNetworks')}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="linkedin_url" className="text-xs">{t('register.linkedin')}</Label>
                      <Input
                        id="linkedin_url"
                        placeholder="https://linkedin.com/in/..."
                        {...register('linkedin_url')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twitter_url" className="text-xs">{t('register.twitter')}</Label>
                      <Input
                        id="twitter_url"
                        placeholder="https://x.com/..."
                        {...register('twitter_url')}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="researchgate_url" className="text-xs">{t('register.researchgate')}</Label>
                      <Input
                        id="researchgate_url"
                        placeholder="https://researchgate.net/profile/..."
                        {...register('researchgate_url')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orcid" className="text-xs">{t('register.orcid')}</Label>
                      <Input
                        id="orcid"
                        placeholder="0000-0000-0000-0000"
                        {...register('orcid')}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {serverError && (
              <p className="text-sm text-danger">{serverError}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending
                ? t('register.sending')
                : t('register.submit')}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {t('register.haveAccount')}{' '}
              <Link to="/login" className="text-primary hover:underline">
                {t('register.loginLink')}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
