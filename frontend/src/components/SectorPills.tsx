import { cn } from '@/lib/utils';

interface Sector {
  id: string;
  label: string;
  count: number;
}

interface SectorPillsProps {
  sectors: Sector[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export default function SectorPills({ sectors, active, onChange, className }: SectorPillsProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)} role="group" aria-label="Filtros por sector tecnológico">
      {sectors.map((sector) => {
        const isActive = sector.id === active;
        return (
          <button
            key={sector.id}
            onClick={() => onChange(sector.id)}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold transition-all duration-150 border',
              isActive
                ? 'bg-accent-orange text-white border-accent-orange shadow-glow-orange'
                : 'bg-surface text-text-secondary border-border hover:border-accent-orange hover:text-accent-orange hover:bg-accent-subtle hover:-translate-y-0.5',
            )}
          >
            {sector.label}
            <span className={cn(
              'px-1.5 py-0.5 text-[10px] font-bold rounded-full',
              isActive ? 'bg-white/20 text-white' : 'bg-black/10 text-text-muted',
            )}>
              {sector.count.toLocaleString('es-ES')}
            </span>
          </button>
        );
      })}
    </div>
  );
}
