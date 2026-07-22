import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export default function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn('inline-flex gap-1 p-1 bg-background rounded-md border border-border-subtle', className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'px-4 py-2 rounded-sm text-sm font-semibold transition-all duration-150 cursor-pointer border-none',
            active === tab.id
              ? 'bg-surface text-foreground shadow-sm'
              : 'text-text-muted hover:text-text-secondary bg-transparent',
          )}
          role="tab"
          aria-selected={active === tab.id}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 text-xs opacity-70">({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}
