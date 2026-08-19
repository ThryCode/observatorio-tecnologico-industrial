import { memo } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  iconBg?: 'blue' | 'orange' | 'green' | 'gold';
}

const iconBgMap = {
  blue: 'bg-info-bg text-info',
  orange: 'bg-accent-subtle text-accent-red',
  green: 'bg-success-bg text-success',
  gold: 'bg-brick/10 text-brick',
};

function KPICard({ label, value, change, changeType = 'neutral', icon, iconBg = 'blue' }: KPICardProps) {
  return (
    <div className="group relative bg-surface rounded-lg border border-border p-4 transition-all duration-base hover:shadow-lg hover:-translate-y-0.5 overflow-hidden" role="region" aria-label={`${label}: ${value}`}>
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-red to-brick opacity-0 group-hover:opacity-100 transition-opacity duration-base" />
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs uppercase font-semibold tracking-wider text-text-muted">{label}</span>
        <div className={cn(
          'w-8 h-8 rounded-md flex items-center justify-center transition-all duration-base group-hover:scale-110 group-hover:-rotate-3',
          iconBgMap[iconBg],
        )}>
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-3">
        <span className="text-2xl font-extrabold text-foreground tabular-nums leading-none tracking-tight">{value}</span>
        {change && (
          <span className={cn(
            'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
            changeType === 'positive' && 'bg-success-bg text-success',
            changeType === 'negative' && 'bg-danger-bg text-danger',
            changeType === 'neutral' && 'bg-text-muted/10 text-text-muted',
          )}>
            {changeType === 'positive' && <TrendingUp className="h-3 w-3" />}
            {changeType === 'negative' && <TrendingDown className="h-3 w-3" />}
            {changeType === 'neutral' && <Minus className="h-3 w-3" />}
            {change}
          </span>
        )}
      </div>
    </div>
  );
}

export default memo(KPICard);
