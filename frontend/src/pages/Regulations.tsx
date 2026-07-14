import { useState } from 'react';
import { useRegulations } from '@/hooks/useRegulations';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, FileText, ExternalLink, Calendar } from 'lucide-react';
import { formatDate } from '@/utils/formatters';
import type { Regulation } from '@/types';

const categoryLabels: Record<string, string> = {
  law: 'Ley',
  decree: 'Decreto',
  resolution: 'Resolución',
  standard: 'Norma',
  other: 'Otro',
};

const categoryVariants: Record<string, string> = {
  law: 'destructive',
  decree: 'default',
  resolution: 'secondary',
  standard: 'outline',
  other: 'default',
};

export default function Regulations() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Regulation | null>(null);

  const { data, isLoading } = useRegulations(page, 20, category || undefined);

  const filtered = data?.items.filter(
    (item) =>
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.regulation_number.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Normativas</h2>
        <p className="text-muted-foreground">
          Marco legal y normativo del ecosistema industrial.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar normativas..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="law">Ley</SelectItem>
            <SelectItem value="decree">Decreto</SelectItem>
            <SelectItem value="resolution">Resolucion</SelectItem>
            <SelectItem value="standard">Norma</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titulo</TableHead>
                <TableHead>Numero</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Organismo</TableHead>
                <TableHead>Publicacion</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : filtered?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{item.regulation_number}</code></TableCell>
                      <TableCell>
                        <Badge variant={categoryVariants[item.category] as 'destructive' | 'default' | 'secondary' | 'outline'}>
                          {categoryLabels[item.category] || item.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.issuing_body}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(item.publication_date)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setSelected(item)}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge variant={categoryVariants[selected.category] as 'destructive' | 'default' | 'secondary' | 'outline'}>
                  {categoryLabels[selected.category] || selected.category}
                </Badge>
                <Badge variant="outline">{selected.regulation_number}</Badge>
              </div>
              {selected.summary && (
                <p className="text-sm text-muted-foreground">{selected.summary}</p>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Organismo:</span>
                  <p className="text-muted-foreground">{selected.issuing_body}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Publicacion:</span>
                  <span className="text-muted-foreground">{formatDate(selected.publication_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Vigencia:</span>
                  <span className="text-muted-foreground">
                    {selected.effective_date ? formatDate(selected.effective_date) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Pagina {page} de {data.total_pages} ({data.total} total)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" disabled={page >= data.total_pages} onClick={() => setPage((p) => p + 1)}>
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
