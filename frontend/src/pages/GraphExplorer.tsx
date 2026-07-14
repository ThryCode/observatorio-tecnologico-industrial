import { useState } from 'react';
import { useGraphStats, useGraphSearch } from '@/hooks/useGraph';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Search, Network, AlertCircle } from 'lucide-react';

export default function GraphExplorer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const { data: stats, isLoading: statsLoading } = useGraphStats();
  const { data: searchResults, isLoading: searchLoading } = useGraphSearch(activeQuery);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Explorador del Grafo</h2>
        <p className="text-muted-foreground">
          Visualización y exploración del grafo de conocimiento industrial.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          : stats?.map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.count}</div>
                </CardContent>
              </Card>
            ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Buscar en el Grafo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar nodos (tecnologia, patente, organizacion...)"
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setActiveQuery(searchQuery);
                }}
              />
            </div>
            <Button onClick={() => setActiveQuery(searchQuery)} disabled={!searchQuery}>
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {searchLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {searchResults && searchResults.length === 0 && activeQuery && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-8">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No se encontraron resultados para &quot;{activeQuery}&quot;
            </p>
          </CardContent>
        </Card>
      )}

      {searchResults && searchResults.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {searchResults.length} resultado(s) encontrado(s)
          </p>
          <div className="grid gap-2">
            {searchResults.slice(0, 20).map((result: unknown, i: number) => {
              const node = (result as Record<string, unknown>).n as Record<string, unknown> | undefined;
              const labels = (result as Record<string, unknown>).labels as string[] | undefined;
              return (
                <Card key={i}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <Network className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {typeof node?.name === 'string' ? node.name :
                         typeof node?.title === 'string' ? node.title :
                         typeof node?.id === 'string' ? node.id : 'Nodo'}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {labels?.map((label) => (
                        <Badge key={label} variant="secondary" className="text-xs">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
