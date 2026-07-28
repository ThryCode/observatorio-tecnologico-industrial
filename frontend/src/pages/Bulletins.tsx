import PageHeader from '@/components/PageHeader';
import ProductCard from '@/components/ProductCard';
import { FileText, Clock, User } from 'lucide-react';
import { useBulletins } from '@/hooks/useBulletins';
import type { Bulletin } from '@/types';

function mapBulletinToProductCard(bulletin: Bulletin) {
  return {
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
  const { data: rawBulletins, isLoading } = useBulletins();
  const bulletins = rawBulletins?.items.map(mapBulletinToProductCard) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Boletines y Publicaciones"
        highlight="Publicaciones"
        description="Productos de inteligencia estratégica: boletines, alertas tecnológicas, estudios de prospectiva y mapas de patentes."
      />
      {isLoading ? (
        <div className="text-center text-text-muted py-8">Cargando publicaciones...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bulletins.map((item, i) => (
            <ProductCard key={i} {...item} footer="Producto de inteligencia" />
          ))}
        </div>
      )}
    </div>
  );
}
