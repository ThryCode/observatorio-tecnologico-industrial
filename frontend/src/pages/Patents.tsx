import { useState } from 'react';
import { usePatents } from '@/hooks/usePatents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Calendar, User, FileText, Globe } from 'lucide-react';
import { formatDate, getStatusColor, capitalize } from '@/utils/formatters';
import type { Patent } from '@/types';

const sectorOptions = [
  { value: '', label: 'Todos los sectores' },
  { value: 'SID', label: 'Siderurgia' },
  { value: 'MET', label: 'Metalurgia' },
  { value: 'ELE', label: 'Electrónica' },
  { value: 'QUI', label: 'Química' },
  { value: 'AUT', label: 'Automación' },
];

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'filed', label: 'Solicitada' },
  { value: 'examination', label: 'En examen' },
  { value: 'granted', label: 'Concedida' },
  { value: 'expired', label: 'Expirada' },
  { value: 'rejected', label: 'Rechazada' },
];

const statusLabels: Record<string, string> = {
  filed: 'Solicitada',
  examination: 'En examen',
  granted: 'Concedida',
  expired: 'Expirada',
  rejected: 'Rechazada',
};

export default function Patents() {
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedPatent, setSelectedPatent] = useState<Patent | null>(null);

  const { data, isLoading } = usePatents(page, 20, sector || undefined, status || undefined, search || undefined);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Patentes</h2>
        <p className="text-muted-foreground">
          Registro de patentes nacionales e internacionales por sector tecnológico.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar patentes (título, número, solicitante)..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select value={sector} onValueChange={(v) => { setSector(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sector" />
          </SelectTrigger>
          <SelectContent>
            {sectorOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="mb-2 h-5 w-3/4" />
                <Skeleton className="mb-4 h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data?.items.map((patent) => (
            <Card
              key={patent.id}
              className="cursor-pointer transition-colors hover:border-primary/50"
              onClick={() => setSelectedPatent(patent)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium leading-tight">
                    {patent.title}
                  </CardTitle>
                  <Badge className={getStatusColor(patent.status)}>
                    {statusLabels[patent.status] || capitalize(patent.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  <span>{patent.patent_number}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  <span>{patent.applicant}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(patent.filing_date)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-3.5 w-3.5" />
                  <span>{patent.country}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedPatent} onOpenChange={() => setSelectedPatent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPatent?.title}</DialogTitle>
            <DialogDescription>
              Número: {selectedPatent?.patent_number}
            </DialogDescription>
          </DialogHeader>
          {selectedPatent && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge className={getStatusColor(selectedPatent.status)}>
                  {statusLabels[selectedPatent.status] || capitalize(selectedPatent.status)}
                </Badge>
                <Badge variant="outline">{selectedPatent.country}</Badge>
                {selectedPatent.technological_sector && (
                  <Badge variant="secondary">{selectedPatent.technological_sector}</Badge>
                )}
              </div>

              {selectedPatent.abstract && (
                <div>
                  <h4 className="mb-1 text-sm font-medium">Resumen</h4>
                  <p className="text-sm text-muted-foreground">{selectedPatent.abstract}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Solicitante:</span>
                  <p className="text-muted-foreground">{selectedPatent.applicant}</p>
                </div>
                <div>
                  <span className="font-medium">Inventor(es):</span>
                  <p className="text-muted-foreground">{selectedPatent.inventor}</p>
                </div>
                <div>
                  <span className="font-medium">Fecha de solicitud:</span>
                  <p className="text-muted-foreground">{formatDate(selectedPatent.filing_date)}</p>
                </div>
                <div>
                  <span className="font-medium">Fecha de publicación:</span>
                  <p className="text-muted-foreground">
                    {selectedPatent.publication_date ? formatDate(selectedPatent.publication_date) : '-'}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Sector tecnológico:</span>
                  <p className="text-muted-foreground">
                    {selectedPatent.technological_sector || '-'}
                  </p>
                </div>
                <div>
                  <span className="font-medium">País:</span>
                  <p className="text-muted-foreground">{selectedPatent.country}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {page} de {data.total_pages} ({data.total} total)
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
