import { useState } from 'react';
import CrudPage from '@/components/CrudPage';
import type { CrudColumn } from '@/components/CrudPage';
import { useRegulations, useCreateRegulation, useUpdateRegulation, useDeleteRegulation } from '@/hooks/useRegulations';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDate } from '@/utils/formatters';
import FileUpload from '@/components/FileUpload';
import { Calendar, FileText, Download } from 'lucide-react';
import type { Regulation } from '@/types';

const categoryLabels: Record<string, string> = { law: 'Ley', decree: 'Decreto', resolution: 'Resolución', standard: 'Norma', other: 'Otro' };
type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';
const categoryVariants: Record<string, BadgeVariant> = { law: 'destructive', decree: 'default', resolution: 'secondary', standard: 'outline', other: 'default' };

export default function Regulations() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [selected, setSelected] = useState<Regulation | null>(null);

  const queryResult = useRegulations(page, 20, category || undefined);
  const createMutation = useCreateRegulation();
  const updateMutation = useUpdateRegulation();
  const deleteMutation = useDeleteRegulation();

  const columns: CrudColumn<Regulation>[] = [
    { header: 'Título', render: (r) => <button className="font-medium hover:underline text-left" onClick={() => setSelected(r)}>{r.title}</button> },
    { header: 'Número', render: (r) => <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{r.regulation_number}</code> },
    { header: 'Categoría', render: (r) => <Badge variant={categoryVariants[r.category]}>{categoryLabels[r.category] || r.category}</Badge> },
    { header: 'Organismo', render: (r) => r.issuing_body },
    { header: 'Publicación', render: (r) => <span className="text-muted-foreground">{formatDate(r.publication_date)}</span> },
  ];

  return (
    <>
      <CrudPage
        title="Normativas"
        description="Marco legal y normativo del ecosistema industrial."
        permissionResource="regulations"
        columns={columns}
        queryResult={queryResult}
        createMutation={createMutation}
        updateMutation={updateMutation}
        deleteMutation={deleteMutation}
        page={page}
        onPageChange={setPage}
        searchPlaceholder="Buscar normativas..."
        searchFilter={(item, q) => item.title.toLowerCase().includes(q.toLowerCase()) || item.regulation_number.toLowerCase().includes(q.toLowerCase())}
        filterBar={
          <Select value={category} onValueChange={(v) => { setCategory(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Categoría" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="law">Ley</SelectItem>
              <SelectItem value="decree">Decreto</SelectItem>
              <SelectItem value="resolution">Resolución</SelectItem>
              <SelectItem value="standard">Norma</SelectItem>
            </SelectContent>
          </Select>
        }
        defaultForm={{ title: '', regulation_number: '', issuing_body: '', publication_date: '', effective_date: '', category: '', summary: '', sector_codigo: '', file_url: '' }}
        formToPayload={(form) => ({
          ...form,
          category: form.category as Regulation['category'],
          effective_date: form.effective_date || undefined,
          summary: form.summary || undefined,
          sector_codigo: form.sector_codigo || undefined,
          file_url: form.file_url || undefined,
        })}
        validateForm={(form) => !form.title ? 'El título es obligatorio' : !form.regulation_number ? 'El número es obligatorio' : null}
        renderForm={({ data, onChange }) => (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium">Título *</label>
              <Input value={data.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="Título de la normativa" />
            </div>
            <div>
              <label className="text-sm font-medium">Número *</label>
              <Input value={data.regulation_number} onChange={(e) => onChange({ regulation_number: e.target.value })} placeholder="RES-2025-001" />
            </div>
            <div>
              <label className="text-sm font-medium">Categoría</label>
              <Select value={data.category} onValueChange={(v) => onChange({ category: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="law">Ley</SelectItem>
                  <SelectItem value="decree">Decreto</SelectItem>
                  <SelectItem value="resolution">Resolución</SelectItem>
                  <SelectItem value="standard">Norma</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Organismo</label>
              <Input value={data.issuing_body} onChange={(e) => onChange({ issuing_body: e.target.value })} placeholder="MINDUS" />
            </div>
            <div>
              <label className="text-sm font-medium">Fecha publicación</label>
              <Input type="date" value={data.publication_date} onChange={(e) => onChange({ publication_date: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Fecha vigencia</label>
              <Input type="date" value={data.effective_date} onChange={(e) => onChange({ effective_date: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Resumen</label>
              <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={data.summary} onChange={(e) => onChange({ summary: e.target.value })} placeholder="Resumen de la normativa" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Archivo adjunto</label>
              <FileUpload onUpload={(url) => onChange({ file_url: url })} currentUrl={data.file_url} accept=".pdf,.doc,.docx" />
            </div>
          </div>
        )}
      />

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selected?.title}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge variant={categoryVariants[selected.category]}>{categoryLabels[selected.category] || selected.category}</Badge>
                <Badge variant="outline">{selected.regulation_number}</Badge>
              </div>
              {selected.summary && <p className="text-sm text-muted-foreground">{selected.summary}</p>}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Organismo:</span><p className="text-muted-foreground">{selected.issuing_body}</p></div>
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="font-medium">Publicación:</span><span className="text-muted-foreground">{formatDate(selected.publication_date)}</span></div>
                <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /><span className="font-medium">Vigencia:</span><span className="text-muted-foreground">{selected.effective_date ? formatDate(selected.effective_date) : 'N/A'}</span></div>
              </div>
              {selected.file_url && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Archivo adjunto:</span>
                  <a href={selected.file_url} download className="flex items-center gap-1 text-primary hover:underline"><Download className="h-3.5 w-3.5" />Descargar archivo</a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
