import { useState, useDeferredValue, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Pencil, Trash2, ExternalLink, AlertCircle } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import type { Entity } from '@/hooks/usePermissions';
import type { PaginatedResponse } from '@/types';

export interface CrudColumn<T> {
  header: string;
  className?: string;
  render: (item: T) => React.ReactNode;
}

interface CrudPageProps<T extends { id: string }> {
  title: string;
  description: string;
  permissionResource: Entity;
  columns: CrudColumn<T>[];
  emptyMessage?: string;
  searchPlaceholder?: string;
  filterBar?: React.ReactNode;
  queryResult: { data?: PaginatedResponse<T>; isLoading: boolean; isError: boolean; refetch: () => void };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createMutation: { mutateAsync: (data: any) => Promise<T>; isPending: boolean };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateMutation: { mutateAsync: (data: any) => Promise<T>; isPending: boolean };
  deleteMutation: { mutateAsync: (id: string) => Promise<unknown>; isPending: boolean };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderForm: (props: { data: Record<string, any>; onChange: (patch: Record<string, any>) => void; isEditing: boolean }) => React.ReactNode;
  renderDetail?: (item: T) => React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultForm: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formToPayload: (form: Record<string, any>, isEditing: boolean) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transformEditItem?: (item: T) => Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validateForm?: (form: Record<string, any>) => string | null;
  searchFilter?: (item: T, query: string) => boolean;
  onSearch?: (query: string) => void;
  page: number;
  onPageChange: (page: number) => void;
  canEdit?: (item: T) => boolean;
  canDelete?: (item: T) => boolean;
  nameField?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDisplayName(item: Record<string, any> | null, nameField?: string): string {
  if (!item) return '';
  if (nameField && typeof item[nameField] === 'string') return item[nameField] as string;
  if ('nombre' in item && typeof item.nombre === 'string') return item.nombre;
  if ('title' in item && typeof item.title === 'string') return item.title;
  if ('titulo' in item && typeof item.titulo === 'string') return item.titulo;
  return '';
}

export default function CrudPage<T extends { id: string }>({
  title, description, permissionResource, columns, emptyMessage = 'No hay registros aún.',
  searchPlaceholder = 'Buscar...', filterBar,
  queryResult: { data, isLoading, isError },
  createMutation, updateMutation, deleteMutation,
  renderForm, renderDetail, defaultForm,
  formToPayload, transformEditItem, validateForm, searchFilter, onSearch,
  page, onPageChange,
  canEdit: canEditFn, canDelete: canDeleteFn,
  nameField,
}: CrudPageProps<T>) {
  const { can } = usePermissions();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    if (onSearch) {
      onSearch(deferredSearch);
    }
  }, [deferredSearch, onSearch]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (value !== search) {
      onPageChange(1);
    }
  };
  const [selected, setSelected] = useState<T | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [form, setForm] = useState<Record<string, any>>(defaultForm);
  const [saveError, setSaveError] = useState('');

  const resetForm = () => { setForm(defaultForm); setEditingItem(null); setSaveError(''); };

  const openCreateDialog = () => { resetForm(); setDialogOpen(true); };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openEditDialog = (item: T) => { setEditingItem(item); setForm(transformEditItem ? transformEditItem(item) : { ...item } as Record<string, any>); setDialogOpen(true); };

  const handleSave = async () => {
    if (validateForm) {
      const err = validateForm(form);
      if (err) { setSaveError(err); return; }
    }
    setSaveError('');
    try {
      const payload = formToPayload(form, !!editingItem);
      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, ...payload });
        toast.success('Registro actualizado correctamente');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Registro creado correctamente');
      }
      setDialogOpen(false);
      resetForm();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: unknown } }; message?: string };
      const msg = err?.response?.data?.detail || err?.message || 'Error al guardar. Verifica los datos.';
      setSaveError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const [deleteError, setDeleteError] = useState('');

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setDeleteError('');
    try {
      await deleteMutation.mutateAsync(itemToDelete.id);
      toast.success('Registro eliminado');
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      if (selected?.id === itemToDelete.id) setSelected(null);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: unknown } }; message?: string };
      const msg = err?.response?.data?.detail || err?.message || 'Error al eliminar. Intenta de nuevo.';
      setDeleteError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const filteredItems = !onSearch && searchFilter && deferredSearch ? (data?.items ?? []).filter((i) => searchFilter(i, deferredSearch)) : data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold tracking-tight">{title}</h2><p className="text-muted-foreground">{description}</p></div>
        {can(permissionResource, 'create') && <Button className="gap-2" onClick={openCreateDialog}><Plus className="h-4 w-4" />Nuevo</Button>}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={searchPlaceholder} className="pl-9" value={search} onChange={(e) => handleSearchChange(e.target.value)} />
        </div>
        {filterBar}
      </div>

      {isError ? (
        <Card><CardContent className="flex flex-col items-center gap-2 py-8"><p className="text-sm text-destructive">No se pudieron cargar los datos. Intente de nuevo más tarde.</p></CardContent></Card>
      ) : (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => <TableHead key={c.header} className={c.className}>{c.header}</TableHead>)}
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: columns.length + 1 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
              )) : filteredItems.length > 0 ? filteredItems.map((item) => (
                <TableRow key={item.id}>
                  {columns.map((c) => <TableCell key={c.header}>{c.render(item)}</TableCell>)}
                  <TableCell>
                    <div className="flex gap-1">
                      {can(permissionResource, 'edit') && (!canEditFn || canEditFn(item)) && <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)} aria-label="Editar"><Pencil className="h-4 w-4" /></Button>}
                      {can(permissionResource, 'delete') && (!canDeleteFn || canDeleteFn(item)) && <Button variant="ghost" size="sm" onClick={() => { setItemToDelete(item); setDeleteDialogOpen(true); }} aria-label="Eliminar"><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                      {renderDetail && <Button variant="ghost" size="sm" onClick={() => setSelected(item)} aria-label="Ver detalle"><ExternalLink className="h-4 w-4" /></Button>}
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground">{emptyMessage}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      )}

      {renderDetail && selected && !dialogOpen && !deleteDialogOpen && (
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-md">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <DialogHeader><DialogTitle>{getDisplayName(selected as any, nameField) || 'Detalles'}</DialogTitle></DialogHeader>
            {renderDetail(selected)}
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingItem ? `Editar ${title}` : `Nuevo ${title}`}</DialogTitle></DialogHeader>
          {renderForm({ data: form, onChange: (patch) => setForm((p) => ({ ...p, ...patch })), isEditing: !!editingItem })}
          {saveError && <div className="flex items-center gap-2 text-sm text-danger"><AlertCircle className="h-4 w-4" /><span>{saveError}</span></div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>{editingItem ? 'Actualizar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <DialogHeader><DialogTitle>Confirmar eliminación</DialogTitle><DialogDescription>¿Está seguro de eliminar &quot;{getDisplayName(itemToDelete as any, nameField)}&quot;? Esta acción no se puede deshacer.</DialogDescription></DialogHeader>
          {deleteError && <div className="flex items-center gap-2 text-sm text-danger"><AlertCircle className="h-4 w-4" /><span>{deleteError}</span></div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDeleteError(''); }}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Página {page} de {data.total_pages} ({data.total} total)</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={page >= data.total_pages} onClick={() => onPageChange(page + 1)}>Siguiente</Button>
          </div>
        </div>
      )}
    </div>
  );
}
