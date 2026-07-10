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

## Forms
- React Hook Form for form state
- Zod schemas for validation
- `@hookform/resolvers` for integration

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
