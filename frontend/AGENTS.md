# Frontend Agent Instructions

## Overview
React 18 + TypeScript SPA with Vite, Tailwind CSS, shadcn/ui, and TanStack Query.

## Key Files
- `src/main.tsx` - App entry with QueryClient provider
- `src/App.tsx` - React Router v6 route definitions
- `src/contexts/AuthContext.tsx` - Auth state + localStorage token
- `src/api/client.ts` - Axios instance with auth interceptors
- `src/components/ui/` - shadcn/ui components (button, card, table, etc.)

## React Patterns
- Functional components only, no class components
- `forwardRef` for reusable UI primitives
- Props interface: `interface ComponentProps { ... }` (not inline)
- Path alias: `@/` maps to `./src/` (tsconfig + vite alias)

## TanStack Query
- Hooks in `src/hooks/` wrap query functions from `src/api/`
- `useQuery` for fetching, `useMutation` for create/update/delete
- Query key pattern: `["entity", params]` e.g. `["patents", { page: 1 }]`
- Invalidate on mutation success: `queryClient.invalidateQueries({ queryKey: ["patents"] })`
- Stale time: 5 minutes default

## Tailwind CSS
- Use `cn()` utility from `@/lib/utils` for conditional classes
- CSS variables for theming (defined in `index.css`)
- shadcn/ui components: import from `@/components/ui/`
- Never use inline styles or CSS modules

## API Client Pattern
- Axios instance at `src/api/client.ts`
- Request interceptor: auto-attach Bearer token
- Response interceptor: 401 -> redirect to `/login`
- Mock mode: `VITE_USE_MOCK=true` enables mock data in API functions

## Routing
- React Router v6 with `createBrowserRouter`
- Protected routes: wrap with `<ProtectedRoute>` component
- Auth check: `useAuth()` hook reads from AuthContext
- **Code splitting**: All route pages use `React.lazy()` + `<Suspense>` in `App.tsx`
- Vendor chunks: manualChunks in `vite.config.ts` (vendor/charts/query/forms)

## Dark Mode / Theme System
- Context: `src/contexts/ThemeContext.tsx` — manages dark/light mode
- Persistence: localStorage key `theme`
- CSS variables: defined in `index.css` for both modes
- Toggle: Header component theme button

## i18n (Internationalization)
- Context: `src/contexts/LanguageContext.tsx` — ES/EN toggle
- Translations: `src/i18n/translations.ts` — flat key-value pairs
- Usage: `const { t } = useLanguage(); t('sidebar.dashboard')`
- Persistence: localStorage key `language`
- **All user-visible text must use `t()`** — no hardcoded strings in JSX for labels, titles, buttons, descriptions, placeholders, or toast messages

## Toast Notifications
- Library: sonner (`import { toast } from "sonner"`)
- Usage: `toast.success("Message")`, `toast.error("Error")`
- Toaster component mounted in `App.tsx`

## Graph Layout Modes
- Component: `src/components/ForceGraph2D.tsx`
- Props: `layoutMode?: 'solar' | 'scatter'`
- Solar: force-directed with physics simulation
- Scatter: circular arrangement, no physics
- Used by: GraphExplorer (solar), EnterpriseGraph (scatter)

## Error Boundaries
- Component: `src/components/SectionErrorBoundary.tsx`
- Wraps each page section for isolated error recovery
- Shows fallback UI with retry button

## Forms
- React Hook Form for form state
- Zod schemas for validation
- `@hookform/resolvers` for integration

## Environment
- **Node.js portable**: `G:\Proyects\Observatorio\tools\nodejs\node-v20.18.3-win-x64\node.exe`
- Use portable Node for all build/typecheck commands (system `node` is v12 which is incompatible with TS 5.x)
- TypeScript check: `tools\nodejs\node-v20.18.3-win-x64\node.exe node_modules\typescript\bin\tsc --noEmit`

## Component Structure
```
components/
  ui/          - shadcn/ui primitives (button, card, input, select, etc.)
  Layout.tsx   - Sidebar + Header + Outlet
  Sidebar.tsx  - Navigation with 6 items
  Header.tsx   - Top bar with user info
  KPIs.tsx     - Dashboard metric cards
  GraficoPatentes.tsx - Bar chart (Recharts)
  AlertasTable.tsx    - Alerts data table
```
