import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { searchGraphNodes } from '@/api/graph';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Search,
  FileText,
  Building2,
  Lightbulb,
  Scale,
  BarChart3,
  Newspaper,
  Activity,
  Map,
} from 'lucide-react';

const navItems = [
  { key: 'dashboard', path: '/', icon: BarChart3, labelKey: 'sidebar.dashboard' },
  { key: 'organizations', path: '/organizations', icon: Building2, labelKey: 'sidebar.entidadesCti' },
  { key: 'technologies', path: '/technologies', icon: Lightbulb, labelKey: 'sidebar.tecnologias' },
  { key: 'patents', path: '/patents', icon: FileText, labelKey: 'sidebar.patentes' },
  { key: 'regulations', path: '/regulations', icon: Scale, labelKey: 'page.regulations.title' },
  { key: 'bulletins', path: '/bulletins', icon: Newspaper, labelKey: 'sidebar.boletines' },
  { key: 'indicators', path: '/indicators', icon: Activity, labelKey: 'page.indicators.title' },
  { key: 'patent-maps', path: '/patent-maps', icon: Map, labelKey: 'sidebar.mapasPatentes' },
];

const labelIcon: Record<string, typeof FileText> = {
  Organization: Building2,
  Technology: Lightbulb,
  Patent: FileText,
  Regulation: Scale,
  Bulletin: Newspaper,
  Indicator: Activity,
};

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();

  const { data: searchResults } = useQuery({
    queryKey: ['global-search', search],
    queryFn: () => searchGraphNodes(search, undefined, 1, 8),
    enabled: search.length > 2,
  });

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  const handleNav = useCallback(
    (path: string) => {
      onOpenChange(false);
      navigate(path);
    },
    [onOpenChange, navigate],
  );

  const handleResultSelect = useCallback(
    (type: string, n: Record<string, unknown>) => {
      onOpenChange(false);
      const id = n.id as string;
      const routeMap: Record<string, string> = {
        Organization: '/organizations',
        Technology: '/technologies',
        Patent: '/patents',
        Regulation: '/regulations',
        Bulletin: '/bulletins',
      };
      const base = routeMap[type] || '/organizations';
      navigate(`${base}?highlight=${id}`);
    },
    [onOpenChange, navigate],
  );

  const items = (searchResults?.items ?? []) as Array<{ n: Record<string, unknown>; node_labels: string[] }>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 max-w-lg">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <div className="flex items-center border-b border-border px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <Command.Input
              placeholder={t('commandPalette.placeholder')}
              value={search}
              onValueChange={setSearch}
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              {search.length > 2 ? t('commandPalette.noResults') : t('commandPalette.typeToSearch')}
            </Command.Empty>

            {search.length <= 2 && (
              <Command.Group heading={t('commandPalette.navigation')}>
                {navItems.map((item) => (
                  <Command.Item
                    key={item.key}
                    value={item.key}
                    onSelect={() => handleNav(item.path)}
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent/10 aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{t(item.labelKey as keyof typeof t)}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {items.length > 0 && (
              <Command.Group heading={t('commandPalette.results')}>
                {items.map((item, idx) => {
                  const primaryLabel = item.node_labels[0] || 'Result';
                  const Icon = labelIcon[primaryLabel] || FileText;
                  const name =
                    (item.n.nombre as string) ||
                    (item.n.titulo as string) ||
                    (item.n.name as string) ||
                    String(item.n.id || '');
                  return (
                    <Command.Item
                      key={idx}
                      value={`${primaryLabel}-${String(item.n.id)}`}
                      onSelect={() => handleResultSelect(primaryLabel, item.n)}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent/10 aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span className="flex-1 truncate">{name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{primaryLabel}</span>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
