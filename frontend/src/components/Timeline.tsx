import { cn } from '@/lib/utils';

interface TimelineEvent {
  id: string;
  content: string;
  highlight?: string;
  time: string;
  type?: 'default' | 'small';
}

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export default function Timeline({ events, className }: TimelineProps) {
  return (
    <div className={cn('relative pl-6', className)} role="list" aria-label="Actividad reciente">
      <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-gradient-to-b from-accent-orange via-gold to-border rounded-full" aria-hidden="true" />
      {events.map((event, i) => (
        <div
          key={event.id}
          className={cn(
            'relative pb-6 last:pb-0 animate-fade-in-up',
          )}
          style={{ animationDelay: `${i * 50}ms` }}
          role="listitem"
        >
          <div className={cn(
            'absolute -left-[22px] top-1 rounded-full bg-surface border-2 flex items-center justify-center shadow-[0_0_0_3px_hsl(var(--background))]',
            event.type === 'small' ? 'w-2.5 h-2.5 border-gold left-[19px]' : 'w-3.5 h-3.5 border-accent-orange',
          )}>
            <div className={cn(
              'rounded-full',
              event.type === 'small' ? 'w-1.5 h-1.5 bg-gold' : 'w-[5px] h-[5px] bg-accent-orange',
            )} />
          </div>
          <p className="text-base text-foreground leading-relaxed">
            {event.highlight ? (
              <>
                {event.content.split(event.highlight)[0]}
                <span className="text-accent-orange font-semibold">{event.highlight}</span>
                {event.content.split(event.highlight)[1]}
              </>
            ) : event.content}
          </p>
          <span className="text-xs text-text-muted mt-1 block">{event.time}</span>
        </div>
      ))}
    </div>
  );
}
