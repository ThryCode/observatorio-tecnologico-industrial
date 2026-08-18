import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { useGraphCentrality, useGraphCommunities, useGraphSimilar } from '@/hooks/useGraphAnalytics';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Network, Users, Lightbulb, Search, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

function PagerankTab() {
  const { t } = useLanguage();
  const { data, isLoading, isError, error } = useGraphCentrality(20);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{(error as Error)?.message || t('common.error')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data?.items?.map((item) => ({
    name: item.label.length > 20 ? item.label.slice(0, 20) + '...' : item.label,
    score: Number(item.score.toFixed(4)),
    fullName: item.label,
  })) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5 text-primary" />
          {t('page.graphAnalytics.pagerankTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t('page.graphAnalytics.noData')}</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {t('page.graphAnalytics.pagerankDescription')}
            </p>
            <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 28)}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 120 }}>
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [value.toFixed(4), 'Score']}
                  labelFormatter={(label) => {
                    const item = chartData.find((d) => d.name === label);
                    return item?.fullName || label;
                  }}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={index} fill={`hsl(var(--primary) / ${1 - index * 0.04})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 text-xs text-muted-foreground text-right">
              {data?.total} {t('page.graphAnalytics.nodos').toLowerCase()}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function CommunitiesTab() {
  const { t } = useLanguage();
  const { data, isLoading, isError, error } = useGraphCommunities(50);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}><CardContent className="p-4 space-y-2"><Skeleton className="h-5 w-24" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></CardContent></Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{(error as Error)?.message || t('common.error')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const communities = data?.items ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          {t('page.graphAnalytics.communitiesTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {communities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t('page.graphAnalytics.noData')}</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {t('page.graphAnalytics.communitiesDescription')}
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {communities.map((community) => (
                <div key={community.community_id} className="rounded-lg border border-border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      {t('page.graphAnalytics.comunidad')} {community.community_id}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {community.size} {t('page.graphAnalytics.nodos').toLowerCase()}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {community.nodes.slice(0, 5).map((node) => (
                      <Badge key={node.id} variant="outline" className="text-xs">
                        {node.label}
                      </Badge>
                    ))}
                    {community.nodes.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{community.nodes.length - 5}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-muted-foreground text-right">
              {data?.total} {t('page.graphAnalytics.comunidadesDetectadas').toLowerCase()}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SimilarTab() {
  const { t } = useLanguage();
  const [searchNodeId, setSearchNodeId] = useState('');
  const [query, setQuery] = useState('');
  const { data, isLoading, isError } = useGraphSimilar(query || null);

  const handleSearch = () => {
    setQuery(searchNodeId.trim());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          {t('page.graphAnalytics.knnTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {t('page.graphAnalytics.knnDescription')}
        </p>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder={t('page.graphAnalytics.nodeIdPlaceholder')}
            value={searchNodeId}
            onChange={(e) => setSearchNodeId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={!searchNodeId.trim()}>
            <Search className="h-4 w-4 mr-2" />
            {t('common.buscar')}
          </Button>
        </div>

        {isLoading && query && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-2 text-destructive text-sm py-4">
            <AlertCircle className="h-4 w-4" />
            <span>{t('page.graphAnalytics.noEncontrado')}</span>
          </div>
        )}

        {!query && !isLoading && (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('page.graphAnalytics.ingreseNodeId')}
          </p>
        )}

        {data?.items && data.items.length === 0 && query && !isLoading && (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('page.graphAnalytics.noSimilares')}
          </p>
        )}

        {data?.items && data.items.length > 0 && (
          <div className="space-y-2">
            {data.items.map((node) => (
              <div key={node.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50 border border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{node.label}</p>
                  <p className="text-xs text-muted-foreground">{node.relationship}</p>
                </div>
                <Badge variant="secondary" className="ml-2 shrink-0">
                  {(node.similarity * 100).toFixed(1)}%
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function GraphAnalytics() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('page.graphAnalytics.title')}</h2>
        <p className="text-muted-foreground">{t('page.graphAnalytics.description')}</p>
      </div>

      <Tabs defaultValue="pagerank">
        <TabsList>
          <TabsTrigger value="pagerank" className="gap-2"><Network className="h-4 w-4" />PageRank</TabsTrigger>
          <TabsTrigger value="community" className="gap-2"><Users className="h-4 w-4" />{t('page.graphAnalytics.comunidades')}</TabsTrigger>
          <TabsTrigger value="knn" className="gap-2"><Lightbulb className="h-4 w-4" />kNN</TabsTrigger>
        </TabsList>

        <TabsContent value="pagerank">
          <SectionErrorBoundary title="PageRank">
            <PagerankTab />
          </SectionErrorBoundary>
        </TabsContent>

        <TabsContent value="community">
          <SectionErrorBoundary title={t('page.graphAnalytics.comunidades')}>
            <CommunitiesTab />
          </SectionErrorBoundary>
        </TabsContent>

        <TabsContent value="knn">
          <SectionErrorBoundary title="kNN">
            <SimilarTab />
          </SectionErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
}
