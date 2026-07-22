import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ButtonProps } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void; variant?: ButtonProps['variant'] };
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-8', className)}>
      <div className="text-border-strong mb-4">
        {icon || <Inbox className="h-16 w-16" strokeWidth={1.5} />}
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-base text-text-muted text-center max-w-sm leading-relaxed mb-6">{description}</p>
      {action && (
        <Button variant={action.variant || 'default'} onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
