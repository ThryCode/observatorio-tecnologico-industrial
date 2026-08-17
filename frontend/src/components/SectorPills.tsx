import { cn } from '@/lib/utils';

interface Sector {
  id: string;
  label: string;
  count: number;
}

interface SectorPillsProps {
  sectors: Sector[];
  active: string[];
  onChange: (ids: string[]) => void;
  className?: string;
}

export default function SectorPills({ sectors, active, onChange, className }: SectorPillsProps) {
  const toggle = (id: string) => {
    if (active.includes(id)) {
      onChange(active.filter((s) => s !== id));
    } else {
      onChange([...active, id]);
    }
  };

  return (
    <div className={cn('flex flex-wrap gap-2', className)} role="group" aria-label="Filtros por sector tecnológico">
      {sectors.map((sector) => {
        const isActive = active.includes(sector.id);
        return (
          <button
            key={sector.id}
            onClick={() => toggle(sector.id)}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold transition-all duration-150 border',
              isActive
                ? 'bg-accent-red text-white border-accent-red shadow-glow-red'
                : 'bg-surface text-text-secondary border-border hover:border-accent-red hover:text-accent-red hover:bg-accent-subtle hover:-translate-y-0.5',
            )}
          >
            {sector.label}
          </button>
        );
      })}
    </div>
  );
}
