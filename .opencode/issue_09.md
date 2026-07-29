## Descripcion

El Dashboard actual renderiza datos mock hardcodeados en vez de consumir datos reales de la API. Las cards de "Total Entidades", "Patentes", "Sectores", etc. muestran numeros fijos.

## Archivo

- `frontend/src/pages/Dashboard.tsx:28-45`

```typescript
const stats = {
  totalEntities: 23,
  totalPatents: 12,
  totalSectors: 15,
  // ...datos hardcodeados
};
```

## Comportamiento esperado

El Dashboard deberia:
1. Llamar a `GET /api/v1/indicators` o endpoints especificos para obtener conteos reales
2. Mostrar loading skeleton mientras carga
3. Mostrar error state si falla la API
4. Reflejar cambios cuando se agregan/eliminan entidades

## Fix sugerido

1. Crear un endpoint agregado `GET /api/v1/dashboard/stats` que devuelva:
   ```json
   {
     "total_technologies": 42,
     "total_patents": 12,
     "total_organizations": 8,
     "total_indicators": 15,
     "total_regulations": 6,
     "total_professionals": 4,
     "recent_activity": [...]
   }
   ```
2. O llamar endpoints individuales con `Promise.all()` (mas simple)
3. Reemplazar `stats` hardcodeado con `useQuery`

## Criterios de aceptacion

- [ ] Dashboard muestra datos reales (no mock)
- [ ] Loading state mientras carga
- [ ] Error state si falla
- [ ] `npm run lint` pasa
- [ ] `tsc --noEmit` pasa
