# FE-11: Bulletins — Agregar CRUD Completo

**Épico:** EPIC-FRONTEND-MEJORAS
**Etiquetas:** `frontend`, `backend`, `enhancement`
**Agente:** frontend-coder + backend-coder
**Dependencias:** FE-02 (sistema toast)
**Estimación:** 2 días

---

## Descripción

`Bulletins.tsx` actualmente es read-only (83 líneas). El backend YA tiene endpoints CRUD completos (`POST /bulletins`, `PUT /bulletins/{id}`, `DELETE /bulletins/{id}`) pero el frontend no los expone. Se necesita agregar CRUD completo.

## Problema Actual

- Solo muestra lista de boletines
- No permite crear, editar o eliminar
- `admin_mindus` no puede gestionar boletines desde la UI
- Los boletines son un producto de inteligencia clave para MINDUS

## Solución Propuesta

### 1. Frontend — Migrar a CrudPage

```tsx
import { CrudPage } from "@/components/CrudPage"
import { useBulletins } from "@/hooks/useBulletins"

const bulletinColumns: ColumnDef<Bulletin>[] = [
  { key: "titulo", label: "Título" },
  { 
    key: "categoria", 
    label: "Categoría",
    render: (b) => <Badge variant={categoryVariant[b.categoria]}>{b.categoria}</Badge>,
  },
  { key: "autor", label: "Autor" },
  { 
    key: "fecha_publicacion", 
    label: "Fecha",
    render: (b) => new Date(b.fecha_publicacion).toLocaleDateString("es"),
  },
]

const bulletinFormFields: FormField[] = [
  { key: "titulo", label: "Título", type: "text", required: true },
  { key: "resumen", label: "Resumen", type: "textarea", required: true },
  { key: "categoria", label: "Categoría", type: "select", options: [
    { value: "boletin", label: "Boletín" },
    { value: "estudio", label: "Estudio" },
    { value: "alerta", label: "Alerta" },
    { value: "mapa", label: "Mapa" },
  ]},
  { key: "autor", label: "Autor", type: "text" },
  { key: "sector_codigo", label: "Sector", type: "select", options: sectorOptions },
]

export function Bulletins() {
  const { data, isLoading, createMutation, updateMutation, deleteMutation } = useBulletins()

  return (
    <CrudPage
      title="Boletines"
      data={data?.items || []}
      columns={bulletinColumns}
      formFields={bulletinFormFields}
      isLoading={isLoading}
      total={data?.total || 0}
      createMutation={createMutation}
      updateMutation={updateMutation}
      deleteMutation={deleteMutation}
      searchPlaceholder="Buscar boletines..."
      createLabel="Nuevo Boletín"
    />
  )
}
```

### 2. Frontend — Hook con mutaciones

```tsx
// hooks/useBulletins.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/api/client"
import { useToast } from "@/hooks/useToast"

export function useBulletins() {
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  const list = useQuery({
    queryKey: ["bulletins"],
    queryFn: () => apiClient.get("/bulletins"),
  })

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post("/bulletins", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bulletins"] })
      success("Boletín creado")
    },
    onError: () => error("Error al crear boletín"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => apiClient.put(`/bulletins/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bulletins"] })
      success("Boletín actualizado")
    },
    onError: () => error("Error al actualizar boletín"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/bulletins/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bulletins"] })
      success("Boletín eliminado")
    },
    onError: () => error("Error al eliminar boletín"),
  })

  return {
    data: list.data?.data,
    isLoading: list.isLoading,
    createMutation,
    updateMutation,
    deleteMutation,
  }
}
```

## Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| `frontend/src/pages/Bulletins.tsx` | Reescritura completa con CrudPage |
| `frontend/src/hooks/useBulletins.ts` | Agregar mutaciones create/update/delete |
| `frontend/src/api/bulletins.ts` | Verificar endpoints CRUD |

## Criterios de Aceptación

- [ ] CrudPage muestra tabla de boletines
- [ ] Botón "Nuevo Boletín" funciona
- [ ] Diálogo create con todos los campos
- [ ] Botón editar funciona (admin_mindus)
- [ ] Botón eliminar funciona con confirmación
- [ ] Filtros por categoría funcionan
- [ ] Toast tras create/update/delete (FE-02)
- [ ] Loading state con skeleton (FE-03)
- [ ] Solo admin_mindus puede crear/editar/eliminar
- [ ] `npm run lint` pasa

## Notas para el Agente

- El backend YA tiene todos los endpoints — solo conectar frontend
- Los boletines son públicos (GET sin auth) pero CRUD requiere admin
- Seguir patrón de `Regulations.tsx` que usa CrudPage
- El componente `ProductCard` se puede mantener para la vista de cards
