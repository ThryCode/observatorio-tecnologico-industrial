import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface AlertItem {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  time: string;
  tag: {
    label: string;
    variant: 'accent' | 'info' | 'gold' | 'success';
  };
}

interface AlertListProps {
  alerts: AlertItem[];
  className?: string;
}

const priorityConfig = {
  high: {
    bar: 'bg-danger',
    dot: 'bg-danger shadow-[0_0_8px_rgba(192,57,43,0.5)] animate-pulse-dot',
    icon: AlertTriangle,
  },
  medium: {
    bar: 'bg-warning',
    dot: 'bg-warning',
    icon: AlertCircle,
  },
  low: {
    bar: 'bg-info',
    dot: 'bg-info',
    icon: Info,
  },
};

export default function AlertList({ alerts, className }: AlertListProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)} role="list" aria-label="Alertas de vigilancia">
      {alerts.map((alert) => {
        const config = priorityConfig[alert.priority];
        const Icon = config.icon;

        return (
          <div
            key={alert.id}
            className="group relative flex gap-3 p-4 rounded-md border border-border-subtle bg-surface cursor-pointer transition-all duration-150 hover:border-border hover:shadow-sm hover:translate-x-0.5"
            role="listitem"
          >
            {/* Priority bar */}
            <div className={cn(
              'absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity duration-150',
              config.bar,
            )} />

            {/* Priority indicator */}
            <div className="flex flex-col items-center gap-2 pt-0.5">
              <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', config.dot)} />
              <Icon className={cn(
                'h-4 w-4',
                alert.priority === 'high' && 'text-danger',
                alert.priority === 'medium' && 'text-warning',
                alert.priority === 'low' && 'text-info',
              )} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-semibold text-foreground truncate">{alert.title}</h4>
              <p className="text-xs text-text-muted leading-relaxed line-clamp-2 mt-1">{alert.description}</p>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant={alert.tag.variant} className="text-[10px] uppercase tracking-wider px-1.5 py-0.5">
                  {alert.tag.label}
                </Badge>
                <span className="text-[11px] text-text-muted">{alert.time}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
