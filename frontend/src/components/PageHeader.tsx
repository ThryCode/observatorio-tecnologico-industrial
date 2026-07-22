import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  highlight?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export default function PageHeader({ title, highlight, description, actions, className }: PageHeaderProps) {
  const parts = highlight && title.includes(highlight)
    ? title.split(highlight)
    : null;

  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8', className)}>
      <div className="space-y-1.5">
        <h1 className="text-3xl font-extrabold text-foreground leading-tight">
          {parts ? (
            <>
              {parts[0]}
              <span className="underline-gradient text-accent-orange">{highlight}</span>
              {parts[1]}
            </>
          ) : title}
        </h1>
        {description && (
          <p className="text-base text-text-secondary max-w-[600px] leading-relaxed">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
