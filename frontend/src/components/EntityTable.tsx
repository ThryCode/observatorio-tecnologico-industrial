import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface Entity {
  id: string;
  name: string;
  initials: string;
  type: string;
  status: 'active' | 'pending' | 'inactive';
}

interface EntityTableProps {
  entities: Entity[];
  className?: string;
}

const statusConfig = {
  active: { label: 'Activo', variant: 'success' as const },
  pending: { label: 'Pendiente', variant: 'warning' as const },
  inactive: { label: 'Inactivo', variant: 'secondary' as const },
};

export default function EntityTable({ entities, className }: EntityTableProps) {
  return (
    <div className={cn('overflow-x-auto rounded-md', className)}>
      <table className="w-full border-collapse text-base">
        <thead>
          <tr className="bg-background">
            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-muted border-b border-border text-left rounded-tl-md">Entidad</th>
            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-muted border-b border-border text-left">Tipo</th>
            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-muted border-b border-border text-left rounded-tr-md">Estado</th>
          </tr>
        </thead>
        <tbody>
          {entities.map((entity, i) => {
            const status = statusConfig[entity.status];
            const isLast = i === entities.length - 1;
            return (
              <tr
                key={entity.id}
                className={cn(
                  'transition-colors duration-150 hover:bg-accent-red/[0.02]',
                  !isLast && 'border-b border-border-subtle',
                )}
              >
                <td className={cn('px-4 py-4', isLast && 'rounded-bl-md')}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                      {entity.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-foreground truncate">{entity.name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-[11px] text-text-muted">{entity.type}</span>
                </td>
                <td className={cn('px-4 py-4', isLast && 'rounded-br-md')}>
                  <Badge variant={status.variant} dot className="text-xs">
                    {status.label}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
