# FE-12: Network — Habilitar Search

**Épico:** EPIC-FRONTEND-MEJORAS
**Etiquetas:** `frontend`, `bug`, `enhancement`
**Agente:** frontend-coder
**Dependencias:** Ninguna
**Estimación:** 0.5 días

---

## Descripción

`Network.tsx` tiene un campo de búsqueda deshabilitado (atributo `disabled` hardcodeado). La funcionalidad de búsqueda ya existe en el backend (`GET /professionals?q=...`) pero el frontend no la conecta.

## Problema Actual

- Input de búsqueda tiene `disabled` hardcodeado
- Los usuarios no pueden buscar profesionales por nombre
- La funcionalidad existe pero no está conectada

## Solución Propuesta

```tsx
// En Network.tsx, reemplazar:
// <Input disabled placeholder="Buscar profesionales..." />

// Por:
const [search, setSearch] = useState("")

const { data: professionals } = useQuery({
  queryKey: ["professionals", search],
  queryFn: () => apiClient.get("/professionals", { params: { q: search } }),
})

<Input
  placeholder="Buscar profesionales..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>
```

## Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| `frontend/src/pages/Network.tsx` | Habilitar search input + conectar con API |

## Criterios de Aceptación

- [ ] Input de búsqueda funciona (no disabled)
- [ ] Búsqueda filtra profesionales por nombre
- [ ] Debounce 300ms en la búsqueda
- [ ] Resultados se actualizan al escribir
- [ ] Loading state al buscar
- [ ] Empty state cuando no hay resultados
- [ ] `npm run lint` pasa

## Notas para el Agente

- El endpoint GET /professionals ya soporta `q` parameter
- Usar `useDeferredValue` o debounce manual
- Seguir patrón de búsqueda de `CrudPage.tsx`
