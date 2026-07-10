---
name: react-patterns
description: React/TypeScript patterns for the Observatorio frontend
metadata:
  version: "1.0.0"
  category: "frontend"
  tags: ["react", "typescript", "tailwind", "tanstack-query"]
---

# React Patterns

## When To Use
- Creating new React components in `frontend/src/components/`
- Adding new pages in `frontend/src/pages/`
- Writing TanStack Query hooks in `frontend/src/hooks/`
- Creating API clients in `frontend/src/api/`

## Component Pattern

### Basic Component
```tsx
import { cn } from "@/lib/utils"

interface Props {
  className?: string
  title: string
  description?: string
}

export function InfoCard({ className, title, description }: Props) {
  return (
    <div className={cn("rounded-lg border p-4", className)}>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
```

### Component with forwardRef
```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && <label className="text-sm font-medium">{label}</label>}
        <input
          ref={ref}
          className={cn(
            "flex h-10 w-full rounded-md border px-3 py-2",
            error && "border-red-500",
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
```

## TanStack Query Hook Pattern
```tsx
// hooks/useEntities.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/api/client"

export function useEntities(params?: { sector?: string }) {
  return useQuery({
    queryKey: ["entities", params],
    queryFn: () => apiClient.get("/entities", { params }),
  })
}

export function useCreateEntity() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateEntityInput) =>
      apiClient.post("/entities", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] })
    },
  })
}
```

## API Client Pattern
```tsx
// api/client.ts
import axios from "axios"

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)
```

## Guardrails
- Use `@/` path alias for all imports
- Use `cn()` for conditional classes
- Use TanStack Query for server state
- Use React Context only for auth (not data)
- Never use `any` type in TypeScript

## Anti-Patterns
- DON'T use class components
- DON'T use inline styles
- DON'T put API calls in components (use hooks)
- DON'T use `localStorage` directly in components (use context)
- DON'T skip error boundaries

## Done Checklist
- [ ] Component uses `cn()` for classes
- [ ] Props have TypeScript interface
- [ ] Server state uses TanStack Query
- [ ] Imports use `@/` alias
- [ ] No `any` types
- [ ] `npm run lint` passes
