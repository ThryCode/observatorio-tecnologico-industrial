# FE-09: Patents — Migrar a CrudPage

**Épico:** EPIC-FRONTEND-MEJORAS
**Etiquetas:** `frontend`, `refactor`, `enhancement`
**Agente:** frontend-coder
**Dependencias:** Ninguna
**Estimación:** 2 días

---

## Descripción

`Patents.tsx` es la página más compleja del frontend (451 líneas) y NO usa el componente `CrudPage` reutilizable, implementando su propio CRUD con diálogos personalizados. Esto crea duplicación de código significativa. Se necesita migrar a CrudPage para consistencia.

## Problema Actual

- 451 líneas de código (vs ~140 líneas de otras páginas CRUD)
- Diálogos de create/edit personalizados (no reutilizables)
- Lógica de permisos duplicada
- Lógica de búsqueda duplicada
- Patrón inconsistente con Technologies, Regulations, Publications

## Solución Propuesta

### 1. Definir columnas para CrudPage

```tsx
const patentColumns: ColumnDef<Patent>[] = [
  {
    key: "title",
    label: "Título",
    render: (patent) => (
      <div className="max-w-[300px] truncate">{patent.title}</div>
    ),
  },
  {
    key: "patent_number",
    label: "Número",
    render: (patent) => (
      <Badge variant="outline">{patent.patent_number}</Badge>
    ),
  },
  {
    key: "applicant",
    label: "Solicitante",
  },
  {
    key: "status",
    label: "Estado",
    render: (patent) => (
      <Badge variant={statusVariant[patent.status]}>{patent.status}</Badge>
    ),
  },
  {
    key: "country",
    label: "País",
  },
  {
    key: "filing_date",
    label: "Fecha",
    render: (patent) => new Date(patent.filing_date).toLocaleDateString("es"),
  },
]
```

### 2. Definir formulario para create/edit

```tsx
const patentFormFields: FormField[] = [
  { key: "title", label: "Título", type: "text", required: true },
  { key: "patent_number", label: "Número de Patente", type: "text", required: true },
  { key: "applicant", label: "Solicitante", type: "text", required: true },
  { key: "inventor", label: "Inventor", type: "text" },
  { key: "status", label: "Estado", type: "select", options: statusOptions },
  { key: "country", label: "País", type: "text" },
  { key: "filing_date", label: "Fecha de Solicitud", type: "date", required: true },
  { key: "abstract", label: "Resumen", type: "textarea" },
  { key: "technological_sector", label: "Sector", type: "select", options: sectorOptions },
]
```

### 3. Reescritura de Patents.tsx

```tsx
import { CrudPage } from "@/components/CrudPage"
import { usePatents } from "@/hooks/usePatents"
import { patentColumns } from "./patentColumns"
import { patentFormFields } from "./patentFormFields"

export function Patents() {
  const { data, isLoading, createMutation, updateMutation, deleteMutation } = usePatents()

  return (
    <CrudPage
      title="Patentes"
      data={data?.items || []}
      columns={patentColumns}
      formFields={patentFormFields}
      isLoading={isLoading}
      total={data?.total || 0}
      createMutation={createMutation}
      updateMutation={updateMutation}
      deleteMutation={deleteMutation}
      searchPlaceholder="Buscar patentes..."
    />
  )
}
```

## Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| `frontend/src/pages/Patents.tsx` | Reescritura completa (~140 líneas) |
| `frontend/src/pages/patentColumns.tsx` | **Crear** definición de columnas |
| `frontend/src/pages/patentFormFields.tsx` | **Crear** definición de campos del formulario |

## Criterios de Aceptación

- [ ] Patents.tsx usa CrudPage (no diálogos custom)
- [ ] Tabla muestra: título, número, solicitante, estado, país, fecha
- [ ] Formulario create/edit con todos los campos
- [ ] Búsqueda funciona
- [ ] Filtros por sector y estado funcionan
- [ ] Permisos por rol funcionan (admin_mindus, analista)
- [ ] Delete con confirmación
- [ ] Toast tras create/update/delete (FE-02)
- [ ] Loading state con skeleton (FE-03)
- [ ] Código reducido a ~140 líneas
- [ ] `npm run lint` pasa

## Notas para el Agente

- CrudPage ya soporta: columnas, formularios, búsqueda, paginación, permisos
- No duplicar lógica que CrudPage ya maneja
- El componente `Badge` ya tiene variantes para status
- El componente `FileUpload` se puede agregar como campo personalizado
- La patente number format es `XX-YYYY-NNNN` (validado en backend)
