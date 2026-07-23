import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { AxiosError } from 'axios';
import client from '@/api/client';
import { getIndustrialSectors } from '@/api/industrialSectors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Globe, MapPin, Save, Plus, Edit3 } from 'lucide-react';
import type { Organization } from '@/types';

export default function MiEmpresa() {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { data: org, isLoading, isError, error } = useQuery({
    queryKey: ['my-organization'],
    queryFn: async () => {
      const res = await client.get<Organization>('/auth/me/organization');
      return res.data;
    },
    retry: false,
  });

  const { data: sectorsData } = useQuery({
    queryKey: ['industrial-sectors'],
    queryFn: () => getIndustrialSectors(1, 100),
  });

  const hasOrg = !!org;

  const createForm = useForm({
    defaultValues: {
      nombre: '',
      siglas: '',
      tipo: 'empresa',
      sector_codigo: '',
      pais: 'Cuba',
      provincia: '',
      sitio_web: '',
    },
  });

  const editForm = useForm({
    defaultValues: {
      sitio_web: '',
      pais: '',
      provincia: '',
      sector_codigo: '',
    },
  });

  useEffect(() => {
    if (org) {
      editForm.reset({
        sitio_web: org.sitio_web || '',
        pais: org.pais || '',
        provincia: org.provincia || '',
        sector_codigo: org.sector_codigo || '',
      });
    }
  }, [org, editForm.reset]);

  const createMutation = useMutation({
    mutationFn: async (data: {
      nombre: string; siglas: string; tipo: string;
      sector_codigo: string; pais: string; provincia: string; sitio_web: string;
    }) => {
      const payload: Record<string, string | undefined> = { ...data };
      if (!payload.sector_codigo) delete payload.sector_codigo;
      if (!payload.pais) delete payload.pais;
      if (!payload.provincia) delete payload.provincia;
      if (!payload.sitio_web) delete payload.sitio_web;
      const res = await client.post<Organization>('/auth/me/organization', payload);
      return res.data;
    },
    onSuccess: () => {
      setSuccess(true);
      setServerError(null);
      setIsCreating(false);
      queryClient.invalidateQueries({ queryKey: ['my-organization'] });
    },
    onError: (error) => {
      setSuccess(false);
      if (error instanceof AxiosError && error.response?.data?.detail) {
        setServerError(error.response.data.detail);
      } else {
        setServerError('Error al crear la empresa.');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { sitio_web?: string; pais?: string; provincia?: string; sector_codigo?: string }) => {
      const res = await client.put<Organization>('/auth/me/organization', data);
      return res.data;
    },
    onSuccess: () => {
      setSuccess(true);
      setServerError(null);
      queryClient.invalidateQueries({ queryKey: ['my-organization'] });
    },
    onError: (error) => {
      setSuccess(false);
      if (error instanceof AxiosError && error.response?.data?.detail) {
        setServerError(error.response.data.detail);
      } else {
        setServerError('Error al actualizar la empresa.');
      }
    },
  });

  const onCreateSubmit = (data: {
    nombre: string; siglas: string; tipo: string;
    sector_codigo: string; pais: string; provincia: string; sitio_web: string;
  }) => {
    setSuccess(false);
    setServerError(null);
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: { sitio_web: string; pais: string; provincia: string; sector_codigo: string }) => {
    setSuccess(false);
    setServerError(null);
    const payload: Record<string, string | undefined> = {};
    if (data.sitio_web) payload.sitio_web = data.sitio_web;
    if (data.pais) payload.pais = data.pais;
    if (data.provincia) payload.provincia = data.provincia;
    if (data.sector_codigo) payload.sector_codigo = data.sector_codigo;
    updateMutation.mutate(payload);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Mi Empresa</h2>
          <p className="text-muted-foreground">Administra los datos de tu entidad.</p>
        </div>
        {!hasOrg && !isLoading && !isCreating && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" /> Crear empresa
          </Button>
        )}
      </div>

      {isLoading && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">Cargando...</CardContent>
        </Card>
      )}

      {!isLoading && !hasOrg && !isCreating && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium mb-1">Aún no tienes una empresa registrada</p>
            <p className="text-sm mb-6">Crea tu entidad para empezar a gestionar su información.</p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" /> Crear empresa
            </Button>
          </CardContent>
        </Card>
      )}

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nueva empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre de la empresa *</Label>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <Input id="nombre" placeholder="Nombre de la entidad" {...createForm.register('nombre', { required: true })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siglas">Siglas *</Label>
                  <Input id="siglas" placeholder="CAI" {...createForm.register('siglas', { required: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={createForm.watch('tipo')}
                    onValueChange={(v) => createForm.setValue('tipo', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="empresa">Empresa</SelectItem>
                      <SelectItem value="centro_investigacion">Centro de Investigación</SelectItem>
                      <SelectItem value="ministerio">Ministerio</SelectItem>
                      <SelectItem value="universidad">Universidad</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sector_codigo">Sector industrial</Label>
                <Select
                  value={createForm.watch('sector_codigo')}
                  onValueChange={(v) => createForm.setValue('sector_codigo', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un sector..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sectorsData?.items?.map((s) => (
                      <SelectItem key={s.codigo} value={s.codigo}>
                        {s.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pais">País</Label>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <Input id="pais" placeholder="Cuba" {...createForm.register('pais')} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provincia">Provincia</Label>
                  <Input id="provincia" placeholder="La Habana" {...createForm.register('provincia')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sitio_web">Sitio web</Label>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <Input id="sitio_web" placeholder="https://ejemplo.cu" {...createForm.register('sitio_web')} />
                </div>
              </div>

              {serverError && <p className="text-sm text-red-500">{serverError}</p>}
              {success && <p className="text-sm text-green-500">Empresa creada correctamente.</p>}

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {createMutation.isPending ? 'Creando...' : 'Crear empresa'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {hasOrg && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">{org.nombre} ({org.siglas})</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm mb-4">
                <p><span className="font-medium">Tipo:</span> {org.tipo}</p>
                <p><span className="font-medium">Sector:</span> {sectorsData?.items?.find(s => s.codigo === org.sector_codigo)?.nombre || org.sector_codigo || '-'}</p>
                <p><span className="font-medium">Ubicación:</span> {[org.provincia, org.pais].filter(Boolean).join(', ') || '-'}</p>
                <p><span className="font-medium">Sitio web:</span> {org.sitio_web || '-'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Edit3 className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Editar datos</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sitio_web_edit">Sitio web</Label>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <Input id="sitio_web_edit" placeholder="https://ejemplo.cu" {...editForm.register('sitio_web')} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pais_edit">País</Label>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <Input id="pais_edit" placeholder="Cuba" {...editForm.register('pais')} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provincia_edit">Provincia</Label>
                    <Input id="provincia_edit" placeholder="La Habana" {...editForm.register('provincia')} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sector_codigo_edit">Sector industrial</Label>
                  <Select
                    value={editForm.watch('sector_codigo')}
                    onValueChange={(v) => editForm.setValue('sector_codigo', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un sector..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sectorsData?.items?.map((s) => (
                        <SelectItem key={s.codigo} value={s.codigo}>
                          {s.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {serverError && <p className="text-sm text-red-500">{serverError}</p>}
                {success && <p className="text-sm text-green-500">Datos actualizados correctamente.</p>}

                <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
