import { cn } from '@/lib/utils';
import {
  FileText,
  ScrollText,
  BarChart3,
  AlertTriangle,
  BookOpen,
  Cpu,
  UserPlus,
} from 'lucide-react';
import type { TimelineEvent } from '@/types';

interface DashboardTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const TYPE_META: Record<TimelineEvent['tipo'], { icon: React.ReactNode; dotClass: string; ringClass: string }> = {
  patente: { icon: <FileText className="h-3 w-3" />, dotClass: 'bg-info', ringClass: 'border-info' },
  regulacion: { icon: <ScrollText className="h-3 w-3" />, dotClass: 'bg-red-500', ringClass: 'border-red-500' },
  indicador: { icon: <BarChart3 className="h-3 w-3" />, dotClass: 'bg-purple-500', ringClass: 'border-purple-500' },
  alerta: { icon: <AlertTriangle className="h-3 w-3" />, dotClass: 'bg-amber-500', ringClass: 'border-amber-500' },
  boletin: { icon: <BookOpen className="h-3 w-3" />, dotClass: 'bg-teal-500', ringClass: 'border-teal-500' },
  tecnologia: { icon: <Cpu className="h-3 w-3" />, dotClass: 'bg-sky-500', ringClass: 'border-sky-500' },
  follow: { icon: <UserPlus className="h-3 w-3" />, dotClass: 'bg-emerald-500', ringClass: 'border-emerald-500' },
};

export default function DashboardTimeline({ events, className }: DashboardTimelineProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">No hay actividad reciente.</p>
    );
  }

  return (
    <div className={cn('relative pl-7', className)} role="list" aria-label="Actividad reciente">
      <div
        className="absolute left-[11px] top-1 bottom-1 w-0.5 bg-gradient-to-b from-accent-red via-brick to-border rounded-full"
        aria-hidden="true"
      />
      {events.map((event, i) => {
        const meta = TYPE_META[event.tipo] || TYPE_META.boletin;
        return (
          <div
            key={event.id}
            className="relative pb-5 last:pb-0 animate-fade-in-up"
            style={{ animationDelay: `${i * 50}ms` }}
            role="listitem"
          >
            <div
              className={cn(
                'absolute -left-[22px] top-0.5 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center text-foreground bg-surface',
                meta.ringClass,
              )}
            >
              {meta.icon}
            </div>
            <p className="text-sm text-foreground leading-relaxed">{event.titulo}</p>
            <span className="text-xs text-text-muted mt-1 block">
              {new Date(event.fecha).toLocaleString('es-ES', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
