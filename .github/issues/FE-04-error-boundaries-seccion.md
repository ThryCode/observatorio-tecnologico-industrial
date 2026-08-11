# FE-04: Error Boundaries por Sección

**Épico:** EPIC-FRONTEND-MEJORAS
**Etiquetas:** `frontend`, `ux`, `enhancement`
**Agente:** frontend-coder
**Dependencias:** Ninguna
**Estimación:** 1 día

---

## Descripción

Actualmente, la aplicación tiene un `ErrorBoundary` global que captura errores de toda la app y muestra una pantalla de error completa. Esto es demasiado agresivo — si falla un componente del dashboard (ej: el grafo), toda la página se rompe. Se necesita error boundaries por sección para que un error en un componente no afecte al resto.

## Problema Actual

- `ErrorBoundary.tsx` envuelve toda la aplicación
- Un error en cualquier componente rompe toda la página
- Sin recuperación parcial (el usuario debe refrescar)
- En dashboard, si falla el grafo, se pierden KPIs, alertas, timeline

## Solución Propuesta

Crear un componente `SectionErrorBoundary` que:
1. Capture errores de componentes individuales
2. Muestre un fallback local (no pantalla completa)
3. Permita reintentar la operación
4. Loguee el error para debugging

### 1. Crear `SectionErrorBoundary.tsx`

```tsx
// frontend/src/components/SectionErrorBoundary.tsx
import { Component, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
  children: ReactNode
  title?: string
  onRetry?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Section error:", error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
    this.props.onRetry?.()
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertTriangle className="mb-2 h-8 w-8 text-destructive" />
            <h3 className="mb-1 text-lg font-semibold">
              {this.props.title || "Error en esta sección"}
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              No se pudo cargar esta información. Puede intentar de nuevo.
            </p>
            <Button variant="outline" size="sm" onClick={this.handleRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
          </div>
        </Card>
      )
    }

    return this.props.children
  }
}
```

### 2. Uso en Dashboard.tsx

```tsx
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary"

// En el return del dashboard
<div className="grid gap-6 md:grid-cols-2">
  <SectionErrorBoundary title="Grafo de Conocimiento">
    <KnowledgeGraph sector={selectedSector} />
  </SectionErrorBoundary>
  
  <SectionErrorBoundary title="Alertas">
    <AlertList />
  </SectionErrorBoundary>
  
  <SectionErrorBoundary title="Entidades">
    <EntityTable />
  </SectionErrorBoundary>
  
  <SectionErrorBoundary title="Línea de Tiempo">
    <DashboardTimeline />
  </SectionErrorBoundary>
</div>
```

### 3. Uso en GraphExplorer.tsx

```tsx
<SectionErrorBoundary title="Visualización del Grafo">
  <ForceGraph2D data={graphData} />
</SectionErrorBoundary>
```

## Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| `frontend/src/components/SectionErrorBoundary.tsx` | **Crear** componente |
| `frontend/src/pages/Dashboard.tsx` | Envolver secciones con `SectionErrorBoundary` |
| `frontend/src/pages/GraphExplorer.tsx` | Envolver ForceGraph2D |
| `frontend/src/pages/EnterpriseGraph.tsx` | Envolver ForceGraph2D |
| `frontend/src/pages/Competitiveness.tsx` | Envolver gráfico |
| `frontend/src/pages/PatentMaps.tsx` | Envolver gráfico |

## Criterios de Aceptación

- [ ] Componente `SectionErrorBoundary` creado
- [ ] Dashboard: 4 secciones envueltas (grafo, alertas, entidades, timeline)
- [ ] GraphExplorer: grafo envuelto
- [ ] EnterpriseGraph: grafo envuelto
- [ ] Competitiveness: gráfico envuelto
- [ ] PatentMaps: gráfico envuelto
- [ ] Error en una sección no afecta a las demás
- [ ] Botón "Reintentar" funciona (re-render del componente)
- [ ] Error se loguea en consola para debugging
- [ ] `npm run lint` pasa
- [ ] `npx tsc --noEmit` pasa

## Notas para el Agente

- El componente es una class component (requerido por React Error Boundaries)
- No usar para errores de rendering normal — usar para errores de API/graf
- El `onRetry` es opcional — si no se provee, solo muestra el fallback
- Mantener el diseño consistente con shadcn/ui
- No agregar comentarios innecesarios
