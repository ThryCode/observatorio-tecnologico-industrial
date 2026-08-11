# FE-01: Página 404 para Rutas Desconocidas

**Épico:** EPIC-FRONTEND-MEJORAS
**Etiquetas:** `frontend`, `ux`, `enhancement`
**Agente:** frontend-coder
**Dependencias:** Ninguna
**Estimación:** 0.5 días

---

## Descripción

Actualmente, cuando un usuario navega a una ruta que no existe (ej: `/ruta-inexistente`), la aplicación muestra una página en blanco o un error de React sin contexto. Esto es una mala experiencia de usuario, especialmente en una plataforma gubernamental donde los usuarios pueden compartir URLs incorrectas.

## Problema Actual

- Rutas desconocidas muestran pantalla blanca
- Sin feedback al usuario sobre qué pasó
- Sin opción de navegación de regreso
- Inaceptable para una plataforma de producción del MINDUS

## Solución Propuesta

Crear un componente `NotFound.tsx` que:
1. Se muestre para cualquier ruta no definida en `App.tsx`
2. Muestre un mensaje claro en español ("Página no encontrada")
3. Incluya un botón para volver al Dashboard (`/`)
4. Incluya un botón de "Volver" (history.back())
5. Sea consistente con el diseño visual de la plataforma

## Archivos a Modificar

### 1. Crear `frontend/src/pages/NotFound.tsx`

```tsx
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Home } from "lucide-react"

export function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="mx-auto max-w-md p-8 text-center">
        <div className="mb-4 text-6xl font-bold text-muted-foreground">404</div>
        <h1 className="mb-2 text-2xl font-bold">Página no encontrada</h1>
        <p className="mb-6 text-muted-foreground">
          La página que busca no existe o fue movida a otra ubicación.
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Button onClick={() => navigate("/")}>
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </div>
      </Card>
    </div>
  )
}
```

### 2. Modificar `frontend/src/App.tsx`

Agregar ruta catch-all al final de las definiciones de ruta:

```tsx
// Agregar import
import { NotFound } from "@/pages/NotFound"

// Agregar al final de las rutas, después de todas las demás
{
  path: "*",
  element: <NotFound />,
}
```

## Criterios de Aceptación

- [ ] Navegar a `/ruta-inexistente` muestra la página 404
- [ ] El botón "Volver" ejecuta `history.back()`
- [ ] El botón "Dashboard" navega a `/`
- [ ] El diseño es consistente con la plataforma (Tailwind, shadcn/ui)
- [ ] El componente usa `@/` path alias
- [ ] No hay errores de TypeScript (`npx tsc --noEmit` pasa)
- [ ] ESLint pasa (`npm run lint`)

## Testing

### Test unitario (opcional pero recomendado)

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
  const dashboardButton = screen.getByText("Dashboard")
  expect(dashboardButton).toBeInTheDocument()
})
```

## Notas para el Agente

- Usar `cn()` de `@/lib/utils` para clases condicionales
- Seguir el patrón de componentes existentes (ver `Login.tsx` como referencia)
- El componente debe ser una función exportada (no default export)
- No agregar comentarios innecesarios
- Mantener el texto en español (audiencia MINDUS)
