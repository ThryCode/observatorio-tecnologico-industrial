import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AxiosError } from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLogin } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const loginSchema = z.object({
  username: z.string().min(1, 'Ingrese su usuario o correo electrónico'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { isAuthenticated } = useAuth();
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  if (isAuthenticated) {
    window.location.href = '/';
    return null;
  }

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate({ ...data, username: data.username.toLowerCase() });
  };

  const errorMessage = (() => {
    if (!loginMutation.isError) return null;
    const err = loginMutation.error;
    if (err instanceof AxiosError && err.response?.data?.detail) {
      return err.response.data.detail;
    }
    return 'Error al iniciar sesión. Verifique sus credenciales.';
  })();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Observatorio Tecnológico Industrial</CardTitle>
          <CardDescription>Ingrese sus credenciales para acceder</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario o correo electrónico</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin@mindus.gob.cu"
                {...register('username')}
              />
              {errors.username && (
                <p className="text-xs text-red-500">{errors.username.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="••••••" {...register('password')} />
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>
            {errorMessage && (
              <p className="text-sm text-red-500">{errorMessage}</p>
            )}
            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              No tiene una cuenta?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Solicitar registro
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
