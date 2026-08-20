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
import { queryKeys } from '@/lib/queryKeys';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PendingApprovals() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    user: PendingUser | null;
    reason: string;
  }>({ open: false, user: null, reason: '' });

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.pendingUsers(),
    queryFn: authApi.listPending,
  });

  const approveMutation = useMutation({
    mutationFn: (userId: string) => authApi.approveUser(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.pendingUsers() });
      await queryClient.refetchQueries({ queryKey: queryKeys.pendingUsers() });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      authApi.rejectUser(userId, { reason }),
    onSuccess: async () => {
      setRejectDialog({ open: false, user: null, reason: '' });
      await queryClient.invalidateQueries({ queryKey: queryKeys.pendingUsers() });
      await queryClient.refetchQueries({ queryKey: queryKeys.pendingUsers() });
    },
  });

  const pendingUsers = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('pending.approvalTitle')}
        </h1>
        <p className="text-muted-foreground">
          {t('pending.description')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('pending.title')}</CardTitle>
          <CardDescription>
            {pendingUsers.length === 0
              ? t('pending.noPending')
              : `${pendingUsers.length} ${t('pending.pendingCount')}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : pendingUsers.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              {t('pending.empty')}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('pending.tableUser')}</TableHead>
                  <TableHead>{t('pending.tableName')}</TableHead>
                  <TableHead>{t('pending.tableEmail')}</TableHead>
                  <TableHead>{t('pending.tableType')}</TableHead>
                  <TableHead>{t('pending.tableJobTitle')}</TableHead>
                  <TableHead>{t('pending.tableDate')}</TableHead>
                  <TableHead className="text-right">{t('common.acciones')}</TableHead>
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
                        {user.role === 'representante'
                          ? t('pending.roleRepresentante')
                          : user.role === 'profesional'
                          ? t('pending.roleProfesional')
                          : t('pending.roleAnalista')}
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
                        {t('pending.approve')}
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
                        {t('pending.reject')}
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
            <DialogTitle>{t('pending.rejectTitle')}</DialogTitle>
            <DialogDescription>
              {t('pending.rejectReasonFor')}{' '}
              <strong>{rejectDialog.user?.full_name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">{t('pending.rejectReasonLabel')}</Label>
              <Input
                id="reject-reason"
                placeholder={t('pending.rejectReasonPlaceholder')}
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
              {t('common.cancelar')}
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
              {rejectMutation.isPending ? t('pending.rejecting') : t('pending.reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
