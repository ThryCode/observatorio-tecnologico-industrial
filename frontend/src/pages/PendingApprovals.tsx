import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as authApi from '@/api/auth';
import type { PendingUser } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PendingApprovals() {
  const queryClient = useQueryClient();
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    user: PendingUser | null;
    reason: string;
  }>({ open: false, user: null, reason: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['pending-users'],
    queryFn: authApi.listPending,
  });

  const approveMutation = useMutation({
    mutationFn: (userId: string) => authApi.approveUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      authApi.rejectUser(userId, { reason }),
    onSuccess: () => {
      setRejectDialog({ open: false, user: null, reason: '' });
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
    },
  });

  const pendingUsers = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Aprobación de Usuarios
        </h1>
        <p className="text-muted-foreground">
          Revise y apruebe las solicitudes de registro de nuevos usuarios.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Solicitudes Pendientes</CardTitle>
          <CardDescription>
            {pendingUsers.length === 0
              ? 'No hay solicitudes pendientes.'
              : `${pendingUsers.length} solicitud(es) pendiente(s).`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : pendingUsers.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No hay solicitudes de registro pendientes.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.username}
                    </TableCell>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {user.account_type === 'representante'
                          ? 'Representante CTI'
                          : 'Analista'}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.job_title}</TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('es-CU')}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        onClick={() => approveMutation.mutate(user.id)}
                        disabled={approveMutation.isPending}
                      >
                        Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          setRejectDialog({
                            open: true,
                            user,
                            reason: '',
                          })
                        }
                      >
                        Rechazar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) =>
          setRejectDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar solicitud</DialogTitle>
            <DialogDescription>
              Indique el motivo del rechazo para{' '}
              <strong>{rejectDialog.user?.full_name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Motivo del rechazo</Label>
              <Input
                id="reject-reason"
                placeholder="Escriba el motivo..."
                value={rejectDialog.reason}
                onChange={(e) =>
                  setRejectDialog((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setRejectDialog({ open: false, user: null, reason: '' })
              }
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={
                !rejectDialog.reason.trim() || rejectMutation.isPending
              }
              onClick={() => {
                if (rejectDialog.user) {
                  rejectMutation.mutate({
                    userId: rejectDialog.user.id,
                    reason: rejectDialog.reason,
                  });
                }
              }}
            >
              {rejectMutation.isPending ? 'Rechazando...' : 'Rechazar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
