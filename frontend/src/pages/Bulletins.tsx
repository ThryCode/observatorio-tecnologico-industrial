import PageHeader from '@/components/PageHeader';
import ProductCard from '@/components/ProductCard';
import { FileText, Clock, User } from 'lucide-react';

const bulletins = [
  { type: 'boletin' as const, title: 'Boletín Trimestral de Ciencia y Tecnología — Q2 2026', excerpt: 'Análisis exhaustivo de las tendencias tecnológicas emergentes en los sectores siderúrgico, metalúrgico y químico de la industria cubana.', meta: [{ icon: <FileText className="h-3 w-3" />, text: '24 páginas' }, { icon: <Clock className="h-3 w-3" />, text: 'Julio 2026' }, { icon: <User className="h-3 w-3" />, text: 'OCyT' }] },
  { type: 'estudio' as const, title: 'Estudio de Prospectiva: Inteligencia Artificial en la Industria Manufacturera', excerpt: 'Evaluación del potencial de adopción de IA en los procesos productivos del sector industrial cubano a 2030.', meta: [{ icon: <FileText className="h-3 w-3" />, text: '48 páginas' }, { icon: <Clock className="h-3 w-3" />, text: 'Junio 2026' }, { icon: <User className="h-3 w-3" />, text: 'ICT' }] },
  { type: 'alerta' as const, title: 'Alerta Tecnológica: Nuevos Materiales para Almacenamiento de Hidrógeno', excerpt: 'Detección temprana de innovaciones en materiales de hidruros metálicos con potencial aplicación en la industria energética nacional.', meta: [{ icon: <FileText className="h-3 w-3" />, text: '12 páginas' }, { icon: <Clock className="h-3 w-3" />, text: 'Mayo 2026' }, { icon: <User className="h-3 w-3" />, text: 'CIB' }] },
  { type: 'mapa' as const, title: 'Mapa de Patentes: Tecnologías de Energía Renovable', excerpt: 'Visualización y análisis de la actividad patentaria en energía solar, eólica y biomasa con relevancia para Cuba.', meta: [{ icon: <FileText className="h-3 w-3" />, text: '36 páginas' }, { icon: <Clock className="h-3 w-3" />, text: 'Abril 2026' }, { icon: <User className="h-3 w-3" />, text: 'EDI' }] },
  { type: 'boletin' as const, title: 'Boletín de Normalización Técnica — Julio 2026', excerpt: 'Compendio mensual de nuevas normas ISO, NC y resoluciones técnicas aplicables a la industria.', meta: [{ icon: <FileText className="h-3 w-3" />, text: '18 páginas' }, { icon: <Clock className="h-3 w-3" />, text: 'Julio 2026' }, { icon: <User className="h-3 w-3" />, text: 'LMA' }] },
  { type: 'estudio' as const, title: 'Estudio de Competitividad: Sector Siderúrgico Cubano 2026', excerpt: 'Benchmarking internacional y análisis FODA de la industria siderúrgica nacional frente a mercados clave.', meta: [{ icon: <FileText className="h-3 w-3" />, text: '60 páginas' }, { icon: <Clock className="h-3 w-3" />, text: 'Marzo 2026' }, { icon: <User className="h-3 w-3" />, text: 'MINDUS' }] },
];

export default function Bulletins() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Boletines y Publicaciones"
        highlight="Publicaciones"
        description="Productos de inteligencia estratégica: boletines, alertas tecnológicas, estudios de prospectiva y mapas de patentes."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {bulletins.map((item, i) => (
          <ProductCard key={i} {...item} footer="Producto de inteligencia" />
        ))}
      </div>
    </div>
  );
}
