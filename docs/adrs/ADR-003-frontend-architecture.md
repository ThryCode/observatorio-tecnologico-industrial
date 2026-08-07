# ADR-003: Frontend Architecture (React + TanStack Query)

## Status

Accepted

## Context

The Observatorio frontend needs to:
1. Display data from multiple API endpoints
2. Handle CRUD operations with proper state management
3. Provide real-time updates (WebSocket)
4. Support offline/mock mode for development

## Decision

Use React 18 with TanStack Query for server state management:
- **React**: UI rendering, component composition
- **TanStack Query**: Server state caching, mutations, invalidation
- **React Router**: Client-side routing with code splitting
- **Tailwind CSS**: Styling with utility-first approach

## Consequences

### Positive
- Automatic caching and background refetching
- Optimistic updates for mutations
- DevTools for debugging
- Mock mode via `VITE_USE_MOCK=true`

### Negative
- Additional learning curve for TanStack Query
- Need to manage query keys carefully
- Cache invalidation can be tricky

## Patterns

```typescript
// Query pattern
export function usePatents(page = 1, perPage = 20) {
  return useQuery({
    queryKey: ['patents', page, perPage],
    queryFn: () => getPatents(page, perPage),
  });
}

// Mutation pattern
export function useCreatePatent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPatent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patents'] }),
  });
}
```

## Related

- `frontend/src/hooks/` - TanStack Query hooks
- `frontend/src/api/` - API clients
- `frontend/src/contexts/AuthContext.tsx` - Auth state
