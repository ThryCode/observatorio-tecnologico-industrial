# FE-03: Loading States Consistentes (Skeletons)

**Épico:** EPIC-FRONTEND-MEJORAS
**Etiquetas:** `frontend`, `ux`, `enhancement`
**Agente:** ui-designer
**Dependencias:** Ninguna
**Estimación:** 1 día

---

## Descripción

Actualmente, algunas páginas muestran skeletons personalizados (ej: `Patents.tsx` usa `<Skeleton>` de shadcn/ui), mientras que otras muestran texto ("Cargando...") o nada. Se necesita estandarizar los estados de carga en toda la aplicación para una experiencia visual consistente.

## Problema Actual

- `Patents.tsx`: Skeleton card grid
- `Organizations.tsx`: Skeleton table
- `Dashboard.tsx`: Texto "Cargando..."
- `GraphExplorer.tsx`: Skeleton card
- `Bulletins.tsx`: Sin loading state
- `Competitiveness.tsx`: Sin loading state
- Sin estándar visual para loading states

## Solución Propuesta

Crear componentes de loading reutilizables:

### 1. `PageSkeleton.tsx` — Skeleton para páginas completas

```tsx
// frontend/src/components/PageSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

interface PageSkeletonProps {
  rows?: number
  variant?: "table" | "cards" | "form"
}

export function PageSkeleton({ rows = 5, variant = "table" }: PageSkeletonProps) {
  if (variant === "cards") {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="mb-2 h-4 w-3/4" />
            <Skeleton className="mb-2 h-3 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </Card>
        ))}
      </div>
    )
  }

  if (variant === "form") {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  // variant === "table"
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
```

### 2. `DashboardSkeleton.tsx` — Skeleton específico para dashboard

```tsx
// frontend/src/components/DashboardSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="mb-2 h-4 w-1/2" />
            <Skeleton className="mb-1 h-8 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </Card>
        ))}
      </div>
      
      {/* Content sections */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-4">
          <Skeleton className="mb-4 h-6 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </Card>
        <Card className="p-4">
          <Skeleton className="mb-4 h-6 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    </div>
  )
}
```

### 3. Uso en páginas

```tsx
// En Dashboard.tsx
import { DashboardSkeleton } from "@/components/DashboardSkeleton"

if (isLoading) {
  return <DashboardSkeleton />
}

// En Technologies.tsx, Indicators.tsx, etc.
import { PageSkeleton } from "@/components/PageSkeleton"

if (isLoading) {
  return <PageSkeleton rows={8} variant="table" />
}

// En Patents.tsx (cards)
if (isLoading) {
  return <PageSkeleton rows={6} variant="cards" />
}
```

## Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| `frontend/src/components/PageSkeleton.tsx` | **Crear** componente genérico |
| `frontend/src/components/DashboardSkeleton.tsx` | **Crear** skeleton del dashboard |
| `frontend/src/pages/Dashboard.tsx` | Usar `DashboardSkeleton` |
| `frontend/src/pages/Technologies.tsx` | Usar `PageSkeleton` |
| `frontend/src/pages/Indicators.tsx` | Usar `PageSkeleton` |
| `frontend/src/pages/Patents.tsx` | Reemplazar skeleton custom |
| `frontend/src/pages/Organizations.tsx` | Reemplazar skeleton custom |
| `frontend/src/pages/Regulations.tsx` | Agregar `PageSkeleton` |
| `frontend/src/pages/Bulletins.tsx` | Agregar `PageSkeleton` |
| `frontend/src/pages/Competitiveness.tsx` | Agregar `PageSkeleton` |
| `frontend/src/pages/PatentMaps.tsx` | Agregar `PageSkeleton` |
| `frontend/src/pages/PublicationsPage.tsx` | Agregar `PageSkeleton` |

## Criterios de Aceptación

- [ ] Componente `PageSkeleton` creado con variantes table/cards/form
- [ ] Componente `DashboardSkeleton` creado
- [ ] Dashboard usa `DashboardSkeleton` durante carga
- [ ] Todas las páginas CRUD usan `PageSkeleton`
- [ ] Los skeletons son accesibles (aria-busy, aria-label)
- [ ] Transición suave entre skeleton y contenido real
- [ ] No parpadeo (flash) al cargar datos
- [ ] `npm run lint` pasa

## Notas de Diseño

- **Color:** Usar `bg-muted` para los skeletons (se adapta al tema)
- **Animación:** Shimmer effect (ya viene con shadcn/ui Skeleton)
- **Altura:** Consistente con el contenido real que reemplaza
- **Bordes:** Usar `rounded-md` para consistencia con cards

## Notas para el Agente

- La librería `@/components/ui/skeleton` ya está instalada
- No inventar nuevos patrones de loading
- Los skeleton deben tener `aria-busy="true"` para accesibilidad
- El dashboard es la página más visitada — priorizar su skeleton
