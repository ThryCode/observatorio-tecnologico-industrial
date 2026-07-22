import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };

export default function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <svg
      className={cn('animate-spin', sizeMap[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Cargando"
      role="status"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="hsl(var(--accent-orange))" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
