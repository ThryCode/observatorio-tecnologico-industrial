# FE-16: Advanced Search (Cmd+K Mejorado)

**Épico:** EPIC-FRONTEND-MEJORAS
**Etiquetas:** `frontend`, `ux`, `enhancement`
**Agente:** frontend-coder
**Dependencias:** Ninguna
**Estimación:** 2 días

---

## Descripción

El Topbar ya tiene un botón de búsqueda (Cmd+K) pero es solo un placeholder. Se necesita implementar una búsqueda global que permita buscar en todas las entidades (organizaciones, tecnologías, patentes, etc.) desde un solo diálogo.

## Problema Actual

- Botón Cmd+K existe pero no funciona
- No hay búsqueda global
- Cada página tiene su propia búsqueda
- Sin navegación rápida por comandos

## Solución Propuesta

### 1. Instalar cmdk (command palette)

```bash
npm install cmdk
```

### 2. Crear CommandPalette

```tsx
// frontend/src/components/CommandPalette.tsx
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Command } from "cmdk"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/api/client"
import { Search, FileText, Building2, Lightbulb, Scale, BarChart3 } from "lucide-react"

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const navigate = useNavigate()

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Search across entities
  const { data: results } = useQuery({
    queryKey: ["global-search", search],
    queryFn: () => apiClient.get("/graph/search", { params: { q: search } }),
    enabled: search.length > 2,
  })

  const handleSelect = (type: string, id: string) => {
    setOpen(false)
    switch (type) {
      case "Organization":
        navigate(`/organizations?highlight=${id}`)
        break
      case "Technology":
        navigate(`/technologies?highlight=${id}`)
        break
      case "Patent":
        navigate(`/patents?highlight=${id}`)
        break
      case "Regulation":
        navigate(`/regulations?highlight=${id}`)
        break
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0">
        <Command>
          <Command.Input
            placeholder="Buscar organizaciones, tecnologías, patentes..."
            value={search}
            onValueChange={setSearch}
          />
          <Command.List>
            <Command.Empty>No se encontraron resultados</Command.Empty>
            <Command.Group heading="Navegación">
              <Command.Item onSelect={() => navigate("/")}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Dashboard
              </Command.Item>
              <Command.Item onSelect={() => navigate("/organizations")}>
                <Building2 className="mr-2 h-4 w-4" />
                Organizaciones
              </Command.Item>
              <Command.Item onSelect={() => navigate("/technologies")}>
                <Lightbulb className="mr-2 h-4 w-4" />
                Tecnologías
              </Command.Item>
              <Command.Item onSelect={() => navigate("/patents")}>
                <FileText className="mr-2 h-4 w-4" />
                Patentes
              </Command.Item>
              <Command.Item onSelect={() => navigate("/regulations")}>
                <Scale className="mr-2 h-4 w-4" />
                Normativas
              </Command.Item>
            </Command.Group>
            {results && (
              <Command.Group heading="Resultados">
                {results.map((r: any) => (
                  <Command.Item
                    key={r.id}
                    onSelect={() => handleSelect(r.type, r.id)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    <span>{r.label}</span>
                    <span className="ml-2 text-muted-foreground">{r.type}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
```

### 3. Integrar en Topbar

```tsx
// En Topbar.tsx
import { CommandPalette } from "@/components/CommandPalette"

// Agregar al final del return
<CommandPalette />

// Botón de búsqueda
<Button
  variant="outline"
  className="flex items-center gap-2"
  onClick={() => setOpen(true)}
>
  <Search className="h-4 w-4" />
  <span className="text-muted-foreground">Buscar...</span>
  <kbd className="pointer-events-none ml-2 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium">
    <span className="text-xs">⌘</span>K
  </kbd>
</Button>
```

## Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| `frontend/package.json` | Agregar dependencia `cmdk` |
| `frontend/src/components/CommandPalette.tsx` | **Crear** componente |
| `frontend/src/components/Topbar.tsx` | Integrar CommandPalette |

## Criterios de Aceptación

- [ ] cmdk instalado y configurado
- [ ] CommandPalette abre con Cmd+K / Ctrl+K
- [ ] Búsqueda global funciona (organizaciones, tech, patentes, regulaciones)
- [ ] Navegación rápida por entidades
- [ ] Resultados muestran tipo y label
- [ ] Selección navega a la página correcta
- [ ] Cierre con Escape
- [ ] Responsive (mobile friendly)
- [ ] `npm run lint` pasa

## Notas para el Agente

- cmdk es la librería estándar para command palettes
- El endpoint de búsqueda del grafo ya existe
- No sobrecargar el palette — mantener simple
- Los atajos de teclado son importantes para power users
