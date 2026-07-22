import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'circle' | 'table-row';
}

export function Skeleton({ className, variant = 'text' }: SkeletonProps) {
  if (variant === 'circle') {
    return (
      <div className={cn('rounded-full bg-border-subtle animate-skeleton-shimmer bg-[length:200%_100%]', className)} />
    );
  }

  return (
    <div className={cn('rounded-md bg-border-subtle animate-skeleton-shimmer bg-[length:200%_100%]', className)} />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-surface rounded-lg border border-border p-5 space-y-3">
      <div className="flex justify-between items-start">
        <Skeleton className="h-3 w-20" />
        <Skeleton variant="circle" className="h-9 w-9" />
      </div>
      <Skeleton className="h-8 w-28" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

export default Skeleton;

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 px-4 py-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20 ml-auto" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center px-4 py-4 border-t border-border-subtle">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton variant="circle" className="h-9 w-9 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-6 w-20 shrink-0" />
          <Skeleton className="h-2 w-24 shrink-0" />
        </div>
      ))}
    </div>
  );
}
