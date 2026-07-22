import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import * as authApi from '@/api/auth';
import { getIndustrialSectors } from '@/api/industrialSectors';
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

const registerSchema = z
  .object({
    account_type: z.enum(['representante', 'analista'], {
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
    job_title: z.string().min(1, 'Cargo requerido'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: sectorsData } = useQuery({
    queryKey: ['industrial-sectors'],
    queryFn: () => getIndustrialSectors(1, 100),
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authApi.registerPublic(data),
    onSuccess: () => setSuccess(true),
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.data?.detail) {
        setServerError(error.response.data.detail);
      } else {
        setServerError('Error al registrar. Intente de nuevo.');
      }
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const accountType = watch('account_type');

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              Registro Enviado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              Su solicitud de registro ha sido enviada exitosamente. Un
              administrador revisará su cuenta y le notificará por correo
              electrónico cuando sea aprobada.
            </p>
            <Link to="/login">
              <Button variant="outline" className="w-full">
                Volver al inicio de sesión
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onSubmit = (data: RegisterForm) => {
    setServerError(null);
    const { confirmPassword, ...payload } = data;
    registerMutation.mutate({ ...payload, username: payload.username.toLowerCase() } as RegisterRequest);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            Registro de Usuario
          </CardTitle>
          <CardDescription>
            Complete el formulario para solicitar acceso a la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de cuenta</Label>
              <Select
                value={accountType}
                onValueChange={(v) =>
                  setValue('account_type', v as 'representante' | 'analista')
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="representante">
                    Representante CTI
                  </SelectItem>
                  <SelectItem value="analista">Analista</SelectItem>
                </SelectContent>
              </Select>
              {errors.account_type && (
                <p className="text-xs text-red-500">
                  {errors.account_type.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  placeholder="mi_usuario"
                  {...register('username')}
                />
                {errors.username && (
                  <p className="text-xs text-red-500">
                    {errors.username.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@mindus.gob.cu"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input
                id="full_name"
                placeholder="Juan Pérez García"
                {...register('full_name')}
              />
              {errors.full_name && (
                <p className="text-xs text-red-500">
                  {errors.full_name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="job_title">Cargo</Label>
                {accountType === 'representante' ? (
                  <Select
                    value={watch('job_title') || ''}
                    onValueChange={(v) => setValue('job_title', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el sector empresarial..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sectorsData?.items?.map((s) => (
                        <SelectItem key={s.codigo} value={s.nombre}>
                          {s.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="job_title"
                    placeholder="Especialista en CTI"
                    {...register('job_title')}
                  />
                )}
                {errors.job_title && (
                  <p className="text-xs text-red-500">
                    {errors.job_title.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono (opcional)</Label>
                <Input
                  id="phone"
                  placeholder="+53 5555 5555"
                  {...register('phone')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            {serverError && (
              <p className="text-sm text-red-500">{serverError}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending
                ? 'Enviando registro...'
                : 'Enviar solicitud de registro'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Ya tiene una cuenta?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Iniciar sesión
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
