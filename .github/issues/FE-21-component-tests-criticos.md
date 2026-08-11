# FE-21: Component Tests Críticos

**Épico:** EPIC-FRONTEND-MEJORAS
**Etiquetas:** `frontend`, `testing`, `quality`
**Agente:** test-writer
**Dependencias:** FE-01 a FE-04 (core UX completado)
**Estimación:** 3 días

---

## Descripción

El frontend tiene 86 tests pero la mayoría son de API clients y hooks. Faltan tests de componentes críticos como Sidebar, Layout, ProtectedRoute, KPIs, y los nuevos componentes de UX (NotFound, SectionErrorBoundary, etc.).

## Problema Actual

- Solo 4 tests de componentes (App.test.tsx, Button.test.tsx)
- Sin tests de Sidebar
- Sin tests de Layout
- Sin tests de ProtectedRoute
- Sin tests de KPIs
- Sin tests de NotFound, SectionErrorBoundary

## Solución Propuesta

### 1. Test de NotFound

```tsx
// frontend/src/test/notfound.test.tsx
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { NotFound } from "@/pages/NotFound"

test("renders 404 message", () => {
  render(
    <MemoryRouter>
      <NotFound />
    </MemoryRouter>
  )
  expect(screen.getByText("404")).toBeInTheDocument()
  expect(screen.getByText("Página no encontrada")).toBeInTheDocument()
})

test("dashboard button navigates to /", () => {
  render(
    <MemoryRouter>
      <NotFound />
    </MemoryRouter>
  )
  expect(screen.getByText("Dashboard")).toBeInTheDocument()
})
```

### 2. Test de SectionErrorBoundary

```tsx
// frontend/src/test/section-error-boundary.test.tsx
import { render, screen } from "@testing-library/react"
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary"

const ThrowError = () => {
  throw new Error("Test error")
}

test("renders children when no error", () => {
  render(
    <SectionErrorBoundary>
      <div>Content</div>
    </SectionErrorBoundary>
  )
  expect(screen.getByText("Content")).toBeInTheDocument()
})

test("renders fallback when error", () => {
  render(
    <SectionErrorBoundary title="Test Section">
      <ThrowError />
    </SectionErrorBoundary>
  )
  expect(screen.getByText("Test Section")).toBeInTheDocument()
  expect(screen.getByText("Reintentar")).toBeInTheDocument()
})
```

### 3. Test de ProtectedRoute

```tsx
// frontend/src/test/protected-route.test.tsx
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { AuthProvider } from "@/contexts/AuthContext"

test("redirects to login when not authenticated", () => {
  render(
    <MemoryRouter initialEntries={["/protected"]}>
      <AuthProvider>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AuthProvider>
    </MemoryRouter>
  )
  // Should redirect to login
  expect(screen.queryByText("Protected Content")).not.toBeInTheDocument()
})
```

### 4. Test de KPICard

```tsx
// frontend/src/test/kpi-card.test.tsx
import { render, screen } from "@testing-library/react"
import { KPICard } from "@/components/KPICard"

test("renders title and value", () => {
  render(<KPICard title="Organizaciones" value={42} />)
  expect(screen.getByText("Organizaciones")).toBeInTheDocument()
  expect(screen.getByText("42")).toBeInTheDocument()
})

test("renders trend indicator", () => {
  render(<KPICard title="Test" value={10} change={5} />)
  expect(screen.getByText("+5%")).toBeInTheDocument()
})
```

### 5. Test de Sidebar

```tsx
// frontend/src/test/sidebar.test.tsx
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { Sidebar } from "@/components/Sidebar"

test("renders navigation items", () => {
  render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>
  )
  expect(screen.getByText("Dashboard")).toBeInTheDocument()
  expect(screen.getByText("Organizaciones")).toBeInTheDocument()
  expect(screen.getByText("Tecnologías")).toBeInTheDocument()
})

test("highlights current route", () => {
  render(
    <MemoryRouter initialEntries={["/technologies"]}>
      <Sidebar />
    </MemoryRouter>
  )
  const techItem = screen.getByText("Tecnologías")
  expect(techItem).toHaveClass("bg-primary")
})
```

## Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| `frontend/src/test/notfound.test.tsx` | **Crear** |
| `frontend/src/test/section-error-boundary.test.tsx` | **Crear** |
| `frontend/src/test/protected-route.test.tsx` | **Crear** |
| `frontend/src/test/kpi-card.test.tsx` | **Crear** |
| `frontend/src/test/sidebar.test.tsx` | **Crear** |

## Criterios de Aceptación

- [ ] Test de NotFound (render, buttons)
- [ ] Test de SectionErrorBoundary (children, error, retry)
- [ ] Test de ProtectedRoute (redirect, render)
- [ ] Test de KPICard (title, value, trend)
- [ ] Test de Sidebar (nav items, active route)
- [ ] Todos los tests pasan (`npm test`)
- [ ] Coverage > 80% para componentes críticos

## Notas para el Agente

- Usar @testing-library/react (ya instalado)
- Usar MemoryRouter para tests de routing
- Mockear AuthContext para tests de ProtectedRoute
- No mockear componentes hijos — testear integración
- Seguir patrón de tests existentes en `src/test/`
