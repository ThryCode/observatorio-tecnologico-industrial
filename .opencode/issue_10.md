## Descripcion

Issues cosmeticos/de conveniencia que no afectan funcionalidad pero mejoran mantenibilidad.

## Lista

### 10a) `model_config` inconsistente

Mitad de los schemas usan `model_config = ConfigDict(...)` y la otra mitad `model_config = {...}` (dict plano). Unificar a `ConfigDict(...)` que es el estilo recomendado en Pydantic v2.

**Archivos:** Varios en `app/schemas/`

---

### 10b) `mapSeverityToPriority` duplicado

La funcion esta definida identicamente en:
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/AlertsPage.tsx`

Mover a un helper compartido tipo `frontend/src/utils/alertUtils.ts`.

---

### 10c) `roleLabels` duplicado

El objeto `roleLabels` con la traduccion de roles esta definido identicamente en:
- `frontend/src/components/Sidebar.tsx`
- `frontend/src/components/Topbar.tsx`

Mover a un archivo compartido tipo `frontend/src/utils/roles.ts`.

---

### 10d) Sin `max_length` en campos de texto largos

Schemas que permiten strings arbitrariamente largos sin `max_length`:
- `abstract` en patent schemas
- `summary` en regulation schemas
- `biografia` en professional schemas

Agregar `max_length=2000` o el valor apropiado para validacion y seguridad.

---

### 10e) `/login` usa `window.location.href` en vez de `<Navigate>`

**Archivo:** `frontend/src/pages/Login.tsx:33-34`

```typescript
if (data) {
  window.location.href = "/dashboard";
}
```

Deberia usar el componente `<Navigate>` de React Router para evitar recarga completa de la pagina.

---

## Criterios de aceptacion

- [ ] Todos los schemas usan `ConfigDict(...)`
- [ ] `mapSeverityToPriority` definido una vez en un helper compartido
- [ ] `roleLabels` definido una vez en un helper compartido
- [ ] Campos de texto largos tienen `max_length`
- [ ] Login usa `<Navigate>` en vez de `window.location.href`
- [ ] `ruff check backend/` pasa
- [ ] `npm run lint` pasa
