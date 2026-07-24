# F1-07: Separar professionals API/hooks de auth

**Etiquetas:** `fase-1`, `frontend`, `refactor`
**Hito:** Fase 1 — Calidad
**Depende de:** Ninguna
**Subagente:** `frontend-coder`
**Skill:** `react-patterns`

---

## Descripción

Las funciones de API para `professionals` están actualmente **embebidas dentro de `api/auth.ts`** (líneas 55-82), lo cual es incorrecto conceptualmente. El backend tiene un router dedicado `professionals.py` con 4 endpoints:

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `GET /professionals` | List | Lista paginada de profesionales |
| `GET /professionals/specialties` | List | Lista de especialidades |
| `GET /professionals/me` | Read | Perfil profesional del usuario autenticado |
| `PUT /professionals/me` | Update | Actualizar perfil profesional propio |

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/api/professionals.ts` | **Nuevo** — API client dedicado |
| `src/api/auth.ts` | Eliminar líneas 55-82 (4 funciones de professionals) |
| `src/hooks/useProfessionals.ts` | **Nuevo** — 4 hooks TanStack Query |
| `src/pages/Network.tsx` | Actualizar imports (de `@/api/auth` → `@/api/professionals`) |
| `src/pages/Profile.tsx` | Actualizar imports + refactor a hooks |
| `src/types/index.ts` | Verificar que `ProfessionalProfile` existe |

## Especificación técnica

### 1. Crear `src/api/professionals.ts`

```typescript
import client from './client';
import type { PaginatedResponse, ProfessionalProfile } from '@/types';

export async function listProfessionals(
  page = 1,
  perPage = 20,
  especialidad?: string,
): Promise<PaginatedResponse<ProfessionalProfile>> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  if (especialidad) params.set('especialidad', especialidad);
  const res = await client.get<PaginatedResponse<ProfessionalProfile>>(
    `/professionals?${params}`,
  );
  return res.data;
}

export async function listSpecialties(): Promise<{ items: string[] }> {
  const res = await client.get<{ items: string[] }>('/professionals/specialties');
  return res.data;
}

export async function getMyProfessionalProfile(): Promise<ProfessionalProfile> {
  const res = await client.get<ProfessionalProfile>('/professionals/me');
  return res.data;
}

export async function updateMyProfessionalProfile(
  data: Partial<ProfessionalProfile>,
): Promise<ProfessionalProfile> {
  const res = await client.put<ProfessionalProfile>('/professionals/me', data);
  return res.data;
}
```

### 2. Crear `src/hooks/useProfessionals.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listProfessionals,
  listSpecialties,
  getMyProfessionalProfile,
  updateMyProfessionalProfile,
} from '@/api/professionals';
import type { ProfessionalProfile } from '@/types';

export function useProfessionalList(
  page = 1,
  perPage = 20,
  especialidad?: string,
) {
  return useQuery({
    queryKey: ['professionals', 'list', page, perPage, especialidad],
    queryFn: () => listProfessionals(page, perPage, especialidad),
  });
}

export function useSpecialties() {
  return useQuery({
    queryKey: ['professionals', 'specialties'],
    queryFn: listSpecialties,
    staleTime: 1000 * 60 * 30, // 30 min — cambia poco
  });
}

export function useMyProfessionalProfile() {
  return useQuery({
    queryKey: ['professionals', 'me'],
    queryFn: getMyProfessionalProfile,
    retry: false,
  });
}

export function useUpdateMyProfessionalProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ProfessionalProfile>) =>
      updateMyProfessionalProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals', 'me'] });
    },
  });
}
```

### 3. Limpiar `api/auth.ts`

Eliminar las siguientes funciones (líneas ~55-82 en el archivo actual):
- `listProfessionals`
- `listSpecialties`
- `getMyProfessionalProfile`
- `updateMyProfessionalProfile`

Verificar que no queden imports sin usar.

### 4. Actualizar imports en páginas

**`pages/Network.tsx`:**
```diff
- import { listProfessionals, listSpecialties } from '@/api/auth';
+ import { useProfessionalList, useSpecialties } from '@/hooks/useProfessionals';
```

Reemplazar `useEffect` + `useState` para profesionales con `useProfessionalList(page, 20, specialty)`.

**`pages/Profile.tsx`:**
```diff
- import { getMyProfessionalProfile, updateMyProfessionalProfile } from '@/api/auth';
+ import { useMyProfessionalProfile, useUpdateMyProfessionalProfile } from '@/hooks/useProfessionals';
```

Reemplazar `useEffect` + `useState` para `profProfile` con `useMyProfessionalProfile()`.

## Criterios de aceptación

- [ ] `api/professionals.ts` existe con 4 funciones exportadas
- [ ] `hooks/useProfessionals.ts` existe con 4 hooks
- [ ] `api/auth.ts` ya no contiene funciones de professionals
- [ ] `Network.tsx` usa `useProfessionalList` y `useSpecialties`
- [ ] `Profile.tsx` usa `useMyProfessionalProfile` y `useUpdateMyProfessionalProfile`
- [ ] `npm run lint` pasa sin errores
- [ ] `npm test` pasa

## Riesgos

- **Medio**: Si `Network.tsx` o `Profile.tsx` hacen cosas específicas con los datos (filtrado local, transformaciones), hay que asegurar que la migración a hooks preserve ese comportamiento.
- **Bajo**: Los imports rotos se detectan en compilación (TypeScript strict mode), no hay riesgo silencioso.
