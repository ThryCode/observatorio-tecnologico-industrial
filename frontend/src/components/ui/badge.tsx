import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground shadow',
        outline: 'text-foreground border-border',
        success: 'border-transparent bg-success-bg text-success',
        warning: 'border-transparent bg-warning-bg text-warning',
        danger: 'border-transparent bg-danger-bg text-danger',
        info: 'border-transparent bg-info-bg text-info',
        gold: 'border-transparent bg-gold/10 text-gold',
        accent: 'border-transparent bg-accent-subtle text-accent-orange',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className={cn(
          'h-1.5 w-1.5 rounded-full',
          variant === 'success' && 'bg-success',
          variant === 'warning' && 'bg-warning',
          variant === 'danger' && 'bg-danger',
          variant === 'info' && 'bg-info',
          variant === 'gold' && 'bg-gold',
          variant === 'accent' && 'bg-accent-orange',
          (!variant || variant === 'default') && 'bg-primary-foreground',
        )} />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
