# FE-02: Sistema de Toast/Notificaciones

**Épico:** EPIC-FRONTEND-MEJORAS
**Etiquetas:** `frontend`, `ux`, `enhancement`
**Agente:** ui-designer + frontend-coder
**Dependencias:** Ninguna
**Estimación:** 2 días

---

## Descripción

Actualmente, la aplicación usa estado inline para mostrar mensajes de éxito/error (ej: `success` state en `Profile.tsx`, `SettingsPage.tsx`). Esto es inconsistente, no es reutilizable, y desaparece al navegar. Se necesita un sistema de toast/notificaciones global que proporcione feedback consistente en toda la aplicación.

## Problema Actual

- Cada página maneja mensajes de éxito/error de forma diferente
- Los mensajes desaparecen al navegar a otra página
- Sin estándar visual para notificaciones
- Sin soporte para notificaciones push del backend (WebSocket)
- El sistema de alertas (`AlertasTable.tsx`) es diferente al feedback de usuario

## Solución Propuesta

Implementar un sistema de toast usando **sonner** (librería ligera, recomendada para shadcn/ui):

### 1. Instalar sonner

```bash
npm install sonner
```

### 2. Crear componente `Toaster` wrapper

```tsx
// frontend/src/components/Toaster.tsx
import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          border: "1px solid hsl(var(--border))",
        },
      }}
      closeButton
    />
  )
}
```

### 3. Agregar al layout principal

```tsx
// En App.tsx o Layout.tsx
import { Toaster } from "@/components/Toaster"

// En el return del componente raíz
<Toaster />
```

### 4. Hook `useToast` para uso en componentes

```tsx
// frontend/src/hooks/useToast.ts
import { toast } from "sonner"

export function useToast() {
  return {
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    info: (message: string) => toast.info(message),
    warning: (message: string) => toast.warning(message),
    promise: <T,>(
      promise: Promise<T>,
      opts: { loading: string; success: string; error: string }
    ) => toast.promise(promise, opts),
  }
}
```

### 5. Ejemplo de uso en CrudPage

```tsx
// En CrudPage.tsx, reemplazar el manejo de éxito/error
const { success, error } = useToast()

// En handleCreate:
try {
  await createMutation.mutateAsync(data)
  success("Entidad creada correctamente")
  setIsCreateDialogOpen(false)
} catch (e) {
  error("Error al crear la entidad")
}

// En handleDelete:
try {
  await deleteMutation.mutateAsync(id)
  success("Entidad eliminada correctamente")
} catch (e) {
  error("Error al eliminar la entidad")
}
```

## Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| `frontend/package.json` | Agregar dependencia `sonner` |
| `frontend/src/components/Toaster.tsx` | **Crear** componente wrapper |
| `frontend/src/hooks/useToast.ts` | **Crear** hook personalizado |
| `frontend/src/App.tsx` | Agregar `<Toaster />` al layout |
| `frontend/src/components/CrudPage.tsx` | Reemplazar manejo de errores con toast |
| `frontend/src/pages/Profile.tsx` | Reemplazar `success`/`error` state con toast |
| `frontend/src/pages/SettingsPage.tsx` | Reemplazar alert() con toast |
| `frontend/src/pages/PendingApprovals.tsx` | Agregar toast tras approve/reject |
| `frontend/src/pages/MiEmpresa.tsx` | Agregar toast tras create/update |

## Criterios de Aceptación

- [ ] `sonner` instalado y configurado
- [ ] Componente `Toaster` renderiza en la raíz de la app
- [ ] Hook `useToast` está disponible y tipado
- [ ] CrudPage muestra toast en create/update/delete
- [ ] Profile muestra toast tras actualizar
- [ ] SettingsPage muestra toast (no alert())
- [ ] PendingApprovals muestra toast tras approve/reject
- [ ] Los toasts tienen: icono, mensaje, botón cerrar
- [ ] Los toasts se auto-cierran después de 4 segundos
- [ ] Los toasts son accesibles (aria-live)
- [ ] `npm run lint` pasa
- [ ] `npx tsc --noEmit` pasa

## Notas de Diseño

- **Posición:** Top-right (estándar industry)
- **Duración:** 4 segundos (configurable por toast)
- **Colores:** Usar CSS variables del tema (background, foreground, border)
- **Iconos:** Usar lucide-react (check-circle para éxito, x-circle para error)
- **Cierre:** Botón X + auto-close
- **Stacking:** Múltiples toasts apilados verticalmente

## Notas para el Agente

- **UI Designer:** Definir estilos y posición del Toaster
- **Frontend Coder:** Implementar hook y migrar páginas existentes
- No romper funcionalidad existente (migración incremental)
- Los toasts deben ser accesibles (screen readers)
- No usar `console.log` para feedback de usuario
