# F3-13: Frontend test infrastructure + tests

**Etiquetas:** `fase-3`, `frontend`, `tests`
**Hito:** Fase 3 — Producción
**Depende de:** F1-07, F1-08
**Subagente:** `test-writer`
**Skill:** `testing`, `react-patterns`

---

## Descripción

Actualmente el frontend tiene solo 4 archivos de test (~11 tests) que cubren `App.tsx`, `Button.tsx` y `utils.ts`. No hay tests para:
- Hooks de TanStack Query
- API clients
- Páginas con lógica de negocio
- AuthContext
- Formularios

## Archivos a crear

| Archivo | Propósito |
|---------|-----------|
| `src/test/test-utils.tsx` | Helper `renderWithProviders` reutilizable |
| `src/test/hooks.test.tsx` | Tests para hooks (useProfessionals, useOrganizations) |
| `src/test/api-clients.test.ts` | Tests para API clients |
| `src/test/auth-context.test.tsx` | Tests para AuthContext |

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `frontend/vite.config.ts` | Agregar configuración explícita de Vitest (si no existe) |

## Especificación técnica

### 1. Crear `src/test/test-utils.tsx`

```typescript
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {},
) {
  const { initialRoute = '/', ...renderOptions } = options;
  const queryClient = createTestQueryClient();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    );
  }

  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }), queryClient };
}
```

### 2. Tests para hooks

```typescript
// src/test/hooks.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// Mockear api/professionals
vi.mock('@/api/professionals', () => ({
  listProfessionals: vi.fn().mockResolvedValue({
    items: [{ id: '1', especialidad: 'Test', user: { full_name: 'Test User' } }],
    total: 1,
  }),
  listSpecialties: vi.fn().mockResolvedValue({ items: ['Test'] }),
}));

describe('useProfessionalList', () => {
  it('returns professional list', async () => {
    const { useProfessionalList } = await import('@/hooks/useProfessionals');

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useProfessionalList(1, 20), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.total).toBe(1);
  });
});
```

### 3. Tests para API clients

```typescript
// src/test/api-clients.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('professionals API client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listProfessionals calls GET /professionals with params', async () => {
    const client = (await import('@/api/client')).default;
    const { listProfessionals } = await import('@/api/professionals');

    vi.mocked(client.get).mockResolvedValue({ data: { items: [], total: 0 } });
    await listProfessionals(1, 20, 'Ingenieria');

    expect(client.get).toHaveBeenCalledWith(
      expect.stringContaining('/professionals?page=1&per_page=20&especialidad=Ingenieria'),
    );
  });
});
```

## Criterios de aceptación

- [ ] `test-utils.tsx` existe con `renderWithProviders` que envuelve en QueryClientProvider + MemoryRouter
- [ ] Tests para hooks principales (professionals, organizations)
- [ ] Tests para API clients (verificar URLs y parámetros)
- [ ] Tests para AuthContext (login, logout, token handling)
- [ ] `npm test` pasa
- [ ] `npm run lint` pasa

## Riesgos

- **Bajo**: Los tests usan mocks y no dependen de backend real.
- **Medio**: Si los hooks cambian su firma (nuevos parámetros), los tests deben actualizarse.
