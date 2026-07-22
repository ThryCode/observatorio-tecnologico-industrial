import { cn } from '@/lib/utils';

interface PillProps {
  label: string;
  active?: boolean;
  count?: number;
  onClick?: () => void;
}

export default function Pill({ label, active, count, onClick }: PillProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150 border',
        active
          ? 'bg-accent-orange text-white border-accent-orange shadow-glow-orange'
          : 'bg-surface text-text-secondary border-border hover:border-accent-orange hover:text-accent-orange hover:bg-accent-subtle hover:-translate-y-0.5',
      )}
    >
      {label}
      {count !== undefined && (
        <span className={cn(
          'px-1.5 py-0.5 text-[10px] font-bold rounded-full',
          active ? 'bg-white/20 text-white' : 'bg-foreground/10 text-text-muted',
        )}>
          {count.toLocaleString('es-ES')}
        </span>
      )}
    </button>
  );
}
