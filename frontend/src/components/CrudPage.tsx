import { useState, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { VirtualItem } from '@tanstack/react-virtual';
import { toast } from 'sonner';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Pencil, Trash2, AlertCircle, X } from 'lucide-react';
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
  renderSidebar?: (item: T) => React.ReactNode;
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
  virtualScroll?: boolean;
  rowHeight?: number;
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
  queryResult: { data, isLoading, isError, refetch },
  createMutation, updateMutation, deleteMutation,
  renderForm, renderDetail, renderSidebar, defaultForm,
  formToPayload, transformEditItem, validateForm, searchFilter, onSearch,
  page, onPageChange,
  canEdit: canEditFn, canDelete: canDeleteFn,
  nameField,
  virtualScroll = false,
  rowHeight = 48,
}: CrudPageProps<T>) {
  const { can } = usePermissions();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      onPageChange(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search, onPageChange]);

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

  const filteredItems = !onSearch && searchFilter && debouncedSearch ? (data?.items ?? []).filter((i) => searchFilter(i, debouncedSearch)) : data?.items ?? [];

  const enableVirtual = virtualScroll && filteredItems.length > 20;
  const virtualizer = useVirtualizer({
    count: enableVirtual ? filteredItems.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
    enabled: enableVirtual,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        highlight={title.split(' ')[0]}
        description={description}
        actions={
          can(permissionResource, 'create') ? (
            <Button className="gap-2" onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              Nuevo
            </Button>
          ) : undefined
        }
      />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            className="pl-9 pr-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {filterBar}
      </div>

      {isError ? (
        <EmptyState
          icon={<AlertCircle className="h-16 w-16" strokeWidth={1.5} />}
          title="Error al cargar"
          description="No se pudieron cargar los datos. Intenta de nuevo."
          action={{ label: 'Reintentar', onClick: () => refetch(), variant: 'outline' }}
        />
      ) : (
      <div className={renderSidebar ? 'grid gap-6 lg:grid-cols-3' : ''}>
        <div className={renderSidebar ? 'lg:col-span-2' : ''}>
          <div className="bg-surface rounded-lg border border-border">
            {isLoading ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((c) => <TableHead key={c.header} className={c.className}>{c.header}</TableHead>)}
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: columns.length + 1 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : filteredItems.length > 0 ? (
              enableVirtual ? (
                <div ref={scrollRef} className="max-h-[600px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        {columns.map((c) => <TableHead key={c.header} className={c.className}>{c.header}</TableHead>)}
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                  </Table>
                  <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative', width: '100%' }}>
                    {virtualizer.getVirtualItems().map((virtualRow: VirtualItem) => {
                      const item = filteredItems[virtualRow.index];
                      return (
                        <div
                          key={item.id}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: `${virtualRow.size}px`,
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                          onClick={() => renderSidebar && setSelected(selected?.id === item.id ? null : item)}
                          className={`flex items-center border-b border-border ${renderSidebar ? `cursor-pointer transition-colors ${selected?.id === item.id ? 'bg-primary/5' : 'hover:bg-muted/50'}` : ''}`}
                        >
                          {columns.map((c) => <div key={c.header} className="flex-1 px-4 py-2 text-sm">{c.render(item)}</div>)}
                          <div className="flex gap-1 px-4">
                            {can(permissionResource, 'edit') && (!canEditFn || canEditFn(item)) && <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEditDialog(item); }} aria-label="Editar"><Pencil className="h-4 w-4" /></Button>}
                            {can(permissionResource, 'delete') && (!canDeleteFn || canDeleteFn(item)) && <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setItemToDelete(item); setDeleteDialogOpen(true); }} aria-label="Eliminar"><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((c) => <TableHead key={c.header} className={c.className}>{c.header}</TableHead>)}
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow
                      key={item.id}
                      onClick={() => renderSidebar && setSelected(selected?.id === item.id ? null : item)}
                      className={renderSidebar ? `cursor-pointer transition-colors ${selected?.id === item.id ? 'bg-primary/5' : 'hover:bg-muted/50'}` : undefined}
                    >
                      {columns.map((c) => <TableCell key={c.header}>{c.render(item)}</TableCell>)}
                      <TableCell>
                        <div className="flex gap-1">
                          {can(permissionResource, 'edit') && (!canEditFn || canEditFn(item)) && <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEditDialog(item); }} aria-label="Editar"><Pencil className="h-4 w-4" /></Button>}
                          {can(permissionResource, 'delete') && (!canDeleteFn || canDeleteFn(item)) && <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setItemToDelete(item); setDeleteDialogOpen(true); }} aria-label="Eliminar"><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )
            ) : (
              <EmptyState title="Sin registros" description={emptyMessage} />
            )}

            {data && data.total_pages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <p className="text-sm text-muted-foreground">{data.total} registros en total</p>
                <div className="flex gap-2">
                  <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="rounded-md border border-border px-3 py-1 text-sm disabled:opacity-50">Anterior</button>
                  <span className="px-3 py-1 text-sm text-muted-foreground">Página {page} de {data.total_pages}</span>
                  <button onClick={() => onPageChange(page + 1)} disabled={page >= data.total_pages} className="rounded-md border border-border px-3 py-1 text-sm disabled:opacity-50">Siguiente</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {renderSidebar && (
          <div className="lg:col-span-1">
            {selected && !dialogOpen && !deleteDialogOpen ? (
              <Card className="sticky top-6">
                <CardContent className="pt-6">
                  {renderSidebar(selected)}
                </CardContent>
              </Card>
            ) : (
              <Card className="sticky top-6">
                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                  Haz clic en un registro para ver sus datos.
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
      )}

      {!renderSidebar && renderDetail && selected && !dialogOpen && !deleteDialogOpen && (
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

      {!renderSidebar && data && data.total_pages > 1 && (
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
