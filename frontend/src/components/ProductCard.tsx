import { cn } from '@/lib/utils';
import { FileText, BookOpen, AlertTriangle, Map, User, Bookmark, Eye } from 'lucide-react';

interface ProductCardProps {
  type: 'alerta' | 'boletin' | 'estudio' | 'mapa';
  title: string;
  excerpt: string;
  meta: { icon: React.ReactNode; text: string }[];
  footer?: string;
  className?: string;
}

const typeConfig = {
  alerta: { label: 'Alerta', color: 'text-accent-orange', icon: AlertTriangle },
  boletin: { label: 'Boletín', color: 'text-info', icon: BookOpen },
  estudio: { label: 'Estudio', color: 'text-success', icon: FileText },
  mapa: { label: 'Mapa', color: 'text-gold', icon: Map },
};

export default function ProductCard({ type, title, excerpt, meta, footer, className }: ProductCardProps) {
  const config = typeConfig[type];
  const TypeIcon = config.icon;

  return (
    <div className={cn(
      'group relative bg-surface rounded-lg border border-border p-5 transition-all duration-250 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden',
      className,
    )}>
      {/* Accent bar on hover */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-accent-orange to-gold opacity-0 group-hover:opacity-100 transition-opacity duration-250 rounded-r-sm" />

      <div className="flex items-center gap-2 mb-3">
        <TypeIcon className={cn('h-4 w-4', config.color)} />
        <span className={cn('text-[11px] font-bold uppercase tracking-wider', config.color)}>
          {config.label}
        </span>
      </div>

      <h3 className="text-lg font-bold text-foreground leading-snug mb-2 line-clamp-2">{title}</h3>
      <p className="text-base text-text-secondary leading-relaxed line-clamp-3 mb-4">{excerpt}</p>

      <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-border-subtle">
        {meta.map((item, i) => (
          <span key={i} className="flex items-center gap-1.5 text-xs text-text-muted">
            {item.icon}
            {item.text}
          </span>
        ))}
      </div>
    </div>
  );
}
