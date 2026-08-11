# FE-10: Organizations — Agregar UPDATE

**Épico:** EPIC-FRONTEND-MEJORAS
**Etiquetas:** `frontend`, `backend`, `enhancement`
**Agente:** frontend-coder + backend-coder
**Dependencias:** Ninguna
**Estimación:** 2 días

---

## Descripción

`Organizations.tsx` actualmente solo permite Crear y Eliminar organizaciones, pero NO permite Editar/Actualizar. Esto es inconsistente con otras entidades y frustrante para usuarios `rep_cti` que necesitan corregir datos de su organización.

## Problema Actual

- No hay botón de "Editar" en la tabla
- No hay diálogo de edición
- `rep_cti` no puede corregir datos de su organización
- `admin_mindus` no puede corregir datos de ninguna organización
- El backend YA tiene endpoint `PUT /organizations/{org_id}`

## Solución Propuesta

### 1. Frontend — Agregar edit a Organizations.tsx

```tsx
// Agregar diálogo de edición (similar a create)
const [editingOrg, setEditingOrg] = useState<Organization | null>(null)

// En la tabla, columna de acciones
<TableCell>
  <div className="flex gap-2">
    {(isOwner || isAdmin) && (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setEditingOrg(org)}
        aria-label="Editar organización"
      >
        <Pencil className="h-4 w-4" />
      </Button>
    )}
    {isAdmin && (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleDelete(org.id)}
        aria-label="Eliminar organización"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    )}
  </div>
</TableCell>

// Diálogo de edición
<Dialog open={!!editingOrg} onOpenChange={() => setEditingOrg(null)}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Editar Organización</DialogTitle>
    </DialogHeader>
    <OrganizationForm
      initialData={editingOrg}
      onSubmit={handleUpdate}
      onCancel={() => setEditingOrg(null)}
    />
  </DialogContent>
</Dialog>
```

### 2. Frontend — Hook de mutación

```tsx
// En useOrganizations.ts, agregar updateMutation
const updateMutation = useMutation({
  mutationFn: (data: UpdateOrganizationInput) =>
    apiClient.put(`/organizations/${data.id}`, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["organizations"] })
    success("Organización actualizada")
  },
  onError: () => error("Error al actualizar organización"),
})
```

### 3. Backend — Verificar endpoint PUT

El backend ya tiene:
```python
@router.put("/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: str,
    data: OrganizationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin_mindus", "rep_cti")),
):
    # Solo el owner puede actualizar (rep_cti) o admin
```

Verificar que funciona correctamente.

## Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| `frontend/src/pages/Organizations.tsx` | Agregar botón editar + diálogo |
| `frontend/src/hooks/useOrganizations.ts` | Agregar updateMutation |
| `backend/app/api/v1/organizations.py` | Verificar endpoint PUT |

## Criterios de Aceptación

- [ ] Botón "Editar" visible para admin_mindus y owner (rep_cti)
- [ ] Diálogo de edición se abre con datos actuales
- [ ] Formulario pre-llenado con datos de la organización
- [ ] Submit actualiza la organización
- [ ] Toast tras éxito/error (FE-02)
- [ ] Solo admin o owner pueden editar
- [ ] `npm run lint` pasa
- [ ] `ruff check backend/` pasa

## Notas para el Agente

- El endpoint PUT ya existe en backend — solo verificar
- Usar el mismo `OrganizationForm` para create y edit
- El botón de editar debe tener `aria-label` para accesibilidad
- Seguir patrón de `PendingApprovals.tsx` para diálogos
