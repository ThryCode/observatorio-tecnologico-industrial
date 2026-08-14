import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/ui/empty-state';
import { CardSkeleton } from '@/components/ui/skeleton';
import { FileText, Clock, User, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBulletins } from '@/hooks/useBulletins';
import type { Bulletin } from '@/types';

function mapBulletinToProductCard(bulletin: Bulletin) {
  return {
    id: bulletin.id,
    type: bulletin.categoria as 'alerta' | 'boletin' | 'estudio' | 'mapa',
    title: bulletin.titulo,
    excerpt: bulletin.resumen,
    meta: [
      { icon: <FileText className="h-3 w-3" />, text: 'Documento' },
      { icon: <Clock className="h-3 w-3" />, text: bulletin.fecha },
      { icon: <User className="h-3 w-3" />, text: bulletin.autor || 'Anónimo' },
    ],
  };
}

export default function Bulletins() {
  const [q, setQ] = useState('');
  const [categoria, setCategoria] = useState<string | undefined>();
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const { data: rawBulletins, isLoading } = useBulletins(1, 20, undefined, categoria, q || undefined, fechaDesde || undefined, fechaHasta || undefined);
  const bulletins = rawBulletins?.items.map(mapBulletinToProductCard) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Boletines y Publicaciones"
        highlight="Publicaciones"
        description="Productos de inteligencia estratégica: boletines, alertas tecnológicas, estudios de prospectiva y mapas de patentes."
        actions={
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar boletines..."
                className="pl-8"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Select value={categoria || 'todas'} onValueChange={(v) => setCategoria(v === 'todas' ? undefined : v)}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Categoría" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="boletin">Boletín</SelectItem>
                <SelectItem value="estudio">Estudio</SelectItem>
                <SelectItem value="alerta">Alerta Tecnológica</SelectItem>
                <SelectItem value="mapa">Mapa</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Input type="date" className="w-[140px]" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} placeholder="Desde" />
              <span className="text-muted-foreground">-</span>
              <Input type="date" className="w-[140px]" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} placeholder="Hasta" />
            </div>
          </div>
        }
      />
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : bulletins.length === 0 ? (
        <div className="bg-surface rounded-lg border border-border">
          <EmptyState
            icon={<FileText className="h-10 w-10 text-text-muted" />}
            title="No hay publicaciones"
            description="Aún no se han publicado boletines, alertas tecnológicas ni estudios de inteligencia."
          />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bulletins.map((item) => (
            <ProductCard key={item.id} {...item} footer="Producto de inteligencia" />
          ))}
        </div>
      )}
    </div>
  );
}
