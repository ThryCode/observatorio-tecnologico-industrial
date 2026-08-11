# FE-13: Dark Mode Toggle

**Épico:** EPIC-FRONTEND-MEJORAS
**Etiquetas:** `frontend`, `ux`, `enhancement`
**Agente:** ui-designer + frontend-coder
**Dependencias:** FE-05 (SettingsPage funcional)
**Estimación:** 2 días

---

## Descripción

La aplicación ya tiene CSS variables para temas (light/dark) definidas en `index.css`, pero no hay toggle para cambiar entre ellos. Se necesita implementar dark mode con persistencia.

## Problema Actual

- CSS variables para dark mode ya existen
- No hay toggle en la UI
- No hay persistencia de la preferencia
- No hay transición suave entre temas

## Solución Propuesta

### 1. Context para theme

```tsx
// frontend/src/contexts/ThemeContext.tsx
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark" | "system"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "light" | "dark"
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("theme") as Theme) || "system"
  })

  const resolvedTheme = theme === "system" 
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : theme

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(resolvedTheme)
    localStorage.setItem("theme", theme)
  }, [theme, resolvedTheme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error("useTheme must be used within ThemeProvider")
  return context
}
```

### 2. Toggle en SettingsPage

```tsx
// En SettingsPage.tsx
import { useTheme } from "@/contexts/ThemeContext"
import { Monitor, Moon, Sun } from "lucide-react"

const { theme, setTheme } = useTheme()

<div className="flex items-center gap-2">
  <Button
    variant={theme === "light" ? "default" : "outline"}
    size="icon"
    onClick={() => setTheme("light")}
  >
    <Sun className="h-4 w-4" />
  </Button>
  <Button
    variant={theme === "dark" ? "default" : "outline"}
    size="icon"
    onClick={() => setTheme("dark")}
  >
    <Moon className="h-4 w-4" />
  </Button>
  <Button
    variant={theme === "system" ? "default" : "outline"}
    size="icon"
    onClick={() => setTheme("system")}
  >
    <Monitor className="h-4 w-4" />
  </Button>
</div>
```

### 3. Toggle rápido en Topbar

```tsx
// En Topbar.tsx, agregar botón de theme
import { useTheme } from "@/contexts/ThemeContext"
import { Moon, Sun } from "lucide-react"

const { resolvedTheme, setTheme } = useTheme()

<Button
  variant="ghost"
  size="icon"
  onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
>
  {resolvedTheme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
</Button>
```

## Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| `frontend/src/contexts/ThemeContext.tsx` | **Crear** context |
| `frontend/src/main.tsx` | Envolver con `ThemeProvider` |
| `frontend/src/pages/SettingsPage.tsx` | Agregar toggle de theme |
| `frontend/src/components/Topbar.tsx` | Agregar toggle rápido |
| `frontend/src/index.css` | Verificar variables CSS para dark |

## Criterios de Aceptación

- [ ] ThemeContext creado y funcional
- [ ] Toggle en SettingsPage (light/dark/system)
- [ ] Toggle rápido en Topbar
- [ ] Persistencia en localStorage
- [ ] Transición suave entre temas
- [ ] System preference respeta prefers-color-scheme
- [ ] Tema se aplica en todo el documento
- [ ] No flash al cargar (SSR-safe)
- [ ] `npm run lint` pasa

## Notas para el Agente

- CSS variables ya están definidas en `index.css`
- No inventar nuevos colores — usar los existentes
- El toggle rápido en Topbar es opcional pero recomendado
- La persistencia es en localStorage (no backend)
