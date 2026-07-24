# F2-10: Estructurar mock data para páginas sin backend

**Etiquetas:** `fase-2`, `frontend`, `mock-data`, `refactor`
**Hito:** Fase 2 — Paridad Frontend-Backend
**Depende de:** Ninguna
**Subagente:** `frontend-coder`
**Skill:** `react-patterns`

---

## Descripción

Varias páginas del frontend tienen datos hardcoded directamente en el componente, lo que las hace difíciles de testear y migrar a backend real cuando exista:

| Página | Ruta | Datos actuales |
|--------|------|---------------|
| `AlertsPage.tsx` | `/alerts` | 7 alertas hardcoded en el componente |
| `Bulletins.tsx` | `/bulletins` | 6 bulletins hardcoded |
| `Competitiveness.tsx` | `/competitiveness` | Datos de gráfico hardcoded |
| `PatentMaps.tsx` | `/patent-maps` | Datos de barras hardcoded |
| `Dashboard.tsx` | `/` | KPIs + timeline + productos hardcoded |
| `SettingsPage.tsx` | `/settings` | UI estática sin datos |

**Objetivo:** Extraer los datos mock a archivos `api/*.ts` siguiendo el patrón `USE_MOCK` existente (ver `api/patents.ts`, `api/indicators.ts`, etc.), y crear hooks TanStack Query preparados para cuando exista backend.

## Archivos a crear

| Archivo | Propósito |
|---------|-----------|
| `src/api/alerts.ts` | API client + mock data (7 alertas) |
| `src/api/bulletins.ts` | API client + mock data (6 bulletins) |
| `src/api/competitiveness.ts` | API client + mock data (benchmarking) |
| `src/api/patentMaps.ts` | API client + mock data (resumen patentes) |
| `src/api/dashboard.ts` | API client + mock data (KPIs + timeline) |
| `src/hooks/useAlerts.ts` | Hook preparado para backend futuro |
| `src/hooks/useBulletins.ts` | Hook preparado para backend futuro |
| `src/hooks/useCompetitiveness.ts` | Hook preparado para backend futuro |
| `src/hooks/usePatentMaps.ts` | Hook preparado para backend futuro |
| `src/hooks/useDashboard.ts` | Hook preparado para backend futuro |

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/AlertsPage.tsx` | Usar `useAlerts()` en vez de datos hardcoded |
| `src/pages/Bulletins.tsx` | Usar `useBulletins()` en vez de datos hardcoded |
| `src/pages/Competitiveness.tsx` | Usar `useCompetitiveness()` en vez de datos hardcoded |
| `src/pages/PatentMaps.tsx` | Usar `usePatentMaps()` en vez de datos hardcoded |
| `src/pages/Dashboard.tsx` | Usar `useDashboard()` para KPIs |
| `src/types/index.ts` | Agregar interfaces faltantes (si no existen) |

## Especificación técnica

### Patrón para cada archivo API

Cada `api/*.ts` debe seguir el patrón existente en `api/patents.ts`:

```typescript
import client from './client';
import type { SomeType } from '@/types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// Mock data
const MOCK_DATA: SomeType[] = [ /* ... */ ];

export async function listItems(): Promise<SomeType[]> {
  if (USE_MOCK) {
    return MOCK_DATA;
  }
  const res = await client.get<SomeType[]>('/some-endpoint');
  return res.data;
}
```

### Interfaces TypeScript necesarias

Agregar a `src/types/index.ts`:

```typescript
export interface Alert {
  id: string;
  titulo: string;
  descripcion: string;
  severidad: 'alta' | 'media' | 'baja';
  fecha: string;
  sector?: string;
  leida: boolean;
}

export interface Bulletin {
  id: string;
  titulo: string;
  resumen: string;
  fecha: string;
  categoria: string;
  autor?: string;
  url?: string;
}

export interface CompetitivenessData {
  sector: string;
  puntaje: number;
  variacion: number;
  indicadores: { nombre: string; valor: number }[];
}

export interface PatentMapSummary {
  tecnologia: string;
  cantidad: number;
  tendencia: 'creciente' | 'estable' | 'decreciente';
}

export interface DashboardKPI {
  label: string;
  value: number;
  unit: string;
  change: number;
  icon: string;
}

export interface TimelineEvent {
  id: string;
  fecha: string;
  titulo: string;
  tipo: 'patente' | 'regulacion' | 'indicador' | 'alerta';
}
```

### Hooks

Cada hook sigue el patrón TanStack Query:

```typescript
// hooks/useAlerts.ts
import { useQuery } from '@tanstack/react-query';
import { listAlerts } from '@/api/alerts';

export function useAlerts(unreadOnly = false) {
  return useQuery({
    queryKey: ['alerts', { unreadOnly }],
    queryFn: () => listAlerts(unreadOnly),
  });
}
```

## Criterios de aceptación

- [ ] Los 5 API clients con mock data existen siguiendo el patrón `USE_MOCK`
- [ ] Los 5 hooks existen usando TanStack Query
- [ ] Las 5 páginas refactorizadas usan hooks en vez de datos hardcoded
- [ ] Las interfaces TypeScript necesarias están en `types/index.ts`
- [ ] `npm run lint` pasa
- [ ] `npm run build` pasa
- [ ] `npm test` pasa

## Riesgos

- **Bajo**: Los datos mock ya existen en los componentes, solo se mueven de lugar. No hay cambio funcional.
- **Medio**: Si hay diferencias entre el mock actual y las interfaces nuevas, puede requerir ajustes. Verificar que los campos coinciden.
