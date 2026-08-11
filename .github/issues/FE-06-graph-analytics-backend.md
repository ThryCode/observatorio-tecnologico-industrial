# FE-06: GraphAnalytics — Integrar con Backend Real

**Épico:** EPIC-FRONTEND-MEJORAS
**Etiquetas:** `frontend`, `ux`, `enhancement`
**Agente:** frontend-coder + backend-coder
**Dependencias:** Ninguna
**Estimación:** 3 días

---

## Descripción

`GraphAnalytics.tsx` es actualmente un placeholder con tres tabs (PageRank, Communities, kNN) que muestran "Connect Neo4j". El backend ya tiene los algoritmos implementados (`35b9e6a feat(graph): add PageRank, Community Detection, and kNN algorithms`). Se necesita conectar el frontend con el backend real.

## Problema Actual

- PageRank tab: muestra "Connect Neo4j"
- Communities tab: muestra "Connect Neo4j"
- kNN tab: tiene inputs pero no funciona
- Sin datos reales del grafo
- Sin visualización de resultados

## Solución Propuesta

### Fase 1: Backend — Verificar endpoints existentes

Los endpoints ya existen según el commit history:
- `GET /api/v1/graph/centrality` (PageRank)
- `GET /api/v1/graph/communities` (Community Detection)
- `GET /api/v1/graph/similar/{id}` (kNN)

Verificar que funcionan y retornan datos correctos.

### Fase 2: Frontend — API client para analytics

```typescript
// frontend/src/api/graphAnalytics.ts
import { apiClient } from "./client"

export interface PageRankResult {
  node_id: string
  label: string
  score: number
}

export interface CommunityResult {
  community_id: number
  nodes: Array<{ id: string; label: string }>
  size: number
}

export interface SimilarNode {
  id: string
  label: string
  similarity: number
}

export const graphAnalyticsApi = {
  getPageRank: (limit?: number) =>
    apiClient.get<PageRankResult[]>("/graph/centrality", { params: { limit } }),

  getCommunities: () =>
    apiClient.get<CommunityResult[]>("/graph/communities"),

  getSimilar: (nodeId: string, limit?: number) =>
    apiClient.get<SimilarNode[]>(`/graph/similar/${nodeId}`, { params: { limit } }),
}
```

### Fase 3: Frontend — Hooks TanStack Query

```typescript
// frontend/src/hooks/useGraphAnalytics.ts
import { useQuery } from "@tanstack/react-query"
import { graphAnalyticsApi } from "@/api/graphAnalytics"

export function usePageRank(limit = 20) {
  return useQuery({
    queryKey: ["graph", "pagerank", limit],
    queryFn: () => graphAnalyticsApi.getPageRank(limit),
  })
}

export function useCommunities() {
  return useQuery({
    queryKey: ["graph", "communities"],
    queryFn: () => graphAnalyticsApi.getCommunities(),
  })
}

export function useSimilarNodes(nodeId: string | null, limit = 10) {
  return useQuery({
    queryKey: ["graph", "similar", nodeId, limit],
    queryFn: () => graphAnalyticsApi.getSimilar(nodeId!, limit),
    enabled: !!nodeId,
  })
}
```

### Fase 4: Frontend — GraphAnalytics.tsx funcional

```tsx
// Reescritura completa de GraphAnalytics.tsx
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/PageHeader"
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary"
import { usePageRank, useCommunities, useSimilarNodes } from "@/hooks/useGraphAnalytics"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Search, TrendingUp, Users, GitBranch } from "lucide-react"

export function GraphAnalytics() {
  const [searchNodeId, setSearchNodeId] = useState("")
  
  const pageRank = usePageRank(20)
  const communities = useCommunities()
  const similar = useSimilarNodes(searchNodeId || null)

  return (
    <div className="space-y-6">
      <PageHeader title="Analíticas del Grafo" />
      
      <Tabs defaultValue="pagerank">
        <TabsList>
          <TabsTrigger value="pagerank">
            <TrendingUp className="mr-2 h-4 w-4" />
            PageRank
          </TabsTrigger>
          <TabsTrigger value="communities">
            <Users className="mr-2 h-4 w-4" />
            Comunidades
          </TabsTrigger>
          <TabsTrigger value="similar">
            <GitBranch className="mr-2 h-4 w-4" />
            Similares
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pagerank">
          <SectionErrorBoundary title="PageRank">
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold">Nodos más Centrales</h3>
              {pageRank.data && (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={pageRank.data}>
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="score" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </SectionErrorBoundary>
        </TabsContent>

        <TabsContent value="communities">
          <SectionErrorBoundary title="Comunidades">
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold">Comunidades Detectadas</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {communities.data?.map((c) => (
                  <Card key={c.community_id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge>Comunidad {c.community_id}</Badge>
                      <span className="text-sm text-muted-foreground">{c.size} nodos</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {c.nodes.slice(0, 5).map((n) => (
                        <Badge key={n.id} variant="outline">{n.label}</Badge>
                      ))}
                      {c.nodes.length > 5 && <Badge variant="outline">+{c.nodes.length - 5}</Badge>}
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </SectionErrorBoundary>
        </TabsContent>

        <TabsContent value="similar">
          <SectionErrorBoundary title="Nodos Similares">
            <Card className="p-6">
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="ID del nodo..."
                  value={searchNodeId}
                  onChange={(e) => setSearchNodeId(e.target.value)}
                />
                <Button disabled={!searchNodeId}>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </Button>
              </div>
              {similar.data && (
                <div className="space-y-2">
                  {similar.data.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-2 rounded-md bg-muted">
                      <span>{s.label}</span>
                      <Badge>{(s.similarity * 100).toFixed(1)}%</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </SectionErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

## Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| `frontend/src/api/graphAnalytics.ts` | **Crear** API client |
| `frontend/src/hooks/useGraphAnalytics.ts` | **Crear** hooks |
| `frontend/src/pages/GraphAnalytics.tsx` | Reescritura completa |
| `backend/app/api/v1/graph.py` | Verificar endpoints de analytics |

## Criterios de Aceptación

- [ ] API client para graph analytics creado
- [ ] Hooks TanStack Query creados
- [ ] PageRank muestra gráfico de barras con datos reales
- [ ] Communities muestra cards con nodos por comunidad
- [ ] kNN funciona con input de node ID
- [ ] Cada tab tiene error boundary (FE-04)
- [ ] Loading states con skeleton (FE-03)
- [ ] Datos se actualizan con stale time de 5 min
- [ ] `npm run lint` pasa
- [ ] `npx tsc --noEmit` pasa

## Notas para el Agente

- **Backend:** Verificar que los endpoints de graph.py funcionan
- **Frontend:** Usar Recharts (ya instalado) para visualizaciones
- Los endpoints pueden retornar 503 si Neo4j no está disponible — manejar gracefully
- No bloquear la UI si Neo4j no está conectado
