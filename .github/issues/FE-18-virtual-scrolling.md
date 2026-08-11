# FE-18: Virtual Scrolling para Listas Grandes

**Épico:** EPIC-FRONTEND-MEJORAS
**Etiquetas:** `frontend`, `performance`, `enhancement`
**Agente:** frontend-coder
**Dependencias:** Ninguna
**Estimación:** 2 días

---

## Descripción

Las páginas que muestran listas grandes (Organizations, Patents, Technologies) renderizan TODOS los elementos en el DOM, lo cual es ineficiente para listas de 100+ items. Se necesita virtual scrolling para mejorar el rendimiento.

## Problema Actual

- Tabla renderiza todos los items en DOM
- Scroll lento en listas grandes
- Alto consumo de memoria
- Posible lag en dispositivos móviles

## Solución Propuesta

### 1. Instalar @tanstack/react-virtual

```bash
npm install @tanstack/react-virtual
```

### 2. Crear componente VirtualTable

```tsx
// frontend/src/components/VirtualTable.tsx
import { useVirtualizer } from "@tanstack/react-virtual"
import { useRef } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface VirtualTableProps<T> {
  data: T[]
  columns: Array<{ key: string; label: string; render?: (item: T) => React.ReactNode }>
  rowHeight?: number
  maxHeight?: number
}

export function VirtualTable<T extends { id: string }>({
  data,
  columns,
  rowHeight = 48,
  maxHeight = 600,
}: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  })

  return (
    <div ref={parentRef} style={{ maxHeight, overflow: "auto" }}>
      <Table>
        <TableHeader className="sticky top-0 bg-background">
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key}>{col.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const item = data[virtualRow.index]
            return (
              <TableRow
                key={item.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    {col.render ? col.render(item) : (item as any)[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
```

### 3. Uso en Organizations.tsx

```tsx
import { VirtualTable } from "@/components/VirtualTable"

const columns = [
  { key: "nombre", label: "Nombre" },
  { key: "siglas", label: "Siglas" },
  { key: "tipo", label: "Tipo" },
  { key: "pais", label: "País" },
]

<VirtualTable data={organizations} columns={columns} />
```

## Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| `frontend/package.json` | Agregar `@tanstack/react-virtual` |
| `frontend/src/components/VirtualTable.tsx` | **Crear** componente |
| `frontend/src/pages/Organizations.tsx` | Usar VirtualTable |
| `frontend/src/pages/Patents.tsx` | Usar VirtualTable (si se mantiene tabla) |
| `frontend/src/pages/Technologies.tsx` | Usar VirtualTable |

## Criterios de Aceptación

- [ ] @tanstack/react-virtual instalado
- [ ] VirtualTable componente creado
- [ ] Organizations usa VirtualTable
- [ ] Scroll suave con 100+ items
- [ ] Solo items visibles están en DOM
- [ ] Row height consistente
- [ ] Sticky header funciona
- [ ] Responsive
- [ ] `npm run lint` pasa

## Notas para el Agente

- @tanstack/react-virtual es la librería estándar para virtual scrolling
- No es necesario para listas < 50 items
- El componente es genérico — funciona con cualquier tipo de dato
- El rowHeight debe ser consistente para que el virtualizer funcione
