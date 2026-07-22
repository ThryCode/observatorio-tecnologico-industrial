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
  orange: 'bg-accent-subtle text-accent-orange',
  green: 'bg-success-bg text-success',
  gold: 'bg-gold/10 text-gold',
};

export default function KPICard({ label, value, change, changeType = 'neutral', icon, iconBg = 'blue' }: KPICardProps) {
  return (
    <div className="group relative bg-surface rounded-lg border border-border p-5 transition-all duration-250 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden" role="region" aria-label={`${label}: ${value}`}>
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-orange to-gold opacity-0 group-hover:opacity-100 transition-opacity duration-250" />
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs uppercase font-semibold tracking-wider text-text-muted">{label}</span>
        <div className={cn(
          'w-9 h-9 rounded-md flex items-center justify-center transition-all duration-250 group-hover:scale-110 group-hover:-rotate-3',
          iconBgMap[iconBg],
        )}>
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-3">
        <span className="text-[32px] font-extrabold text-foreground tabular-nums leading-none tracking-tight">{value}</span>
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
