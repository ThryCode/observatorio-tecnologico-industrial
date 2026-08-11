# FE-15: Real-time Updates (WebSocket)

**Épico:** EPIC-FRONTEND-MEJORAS
**Etiquetas:** `frontend`, `backend`, `enhancement`
**Agente:** frontend-coder + backend-coder
**Dependencias:** FE-02 (sistema toast)
**Estimación:** 3 días

---

## Descripción

El backend ya tiene un sistema de WebSocket (`ws_manager.py`, `ws.py`) que envía notificaciones cuando se crean alertas. Sin embargo, el frontend no lo usa — las alertas se actualizan solo al refrescar la página. Se necesita integrar WebSocket para actualizaciones en tiempo real.

## Problema Actual

- Backend tiene WebSocket endpoint (`GET /ws`)
- Frontend no conecta al WebSocket
- Alertas no se actualizan en tiempo real
- El badge de alertas no se actualiza sin refresh
- El usuario debe refrescar para ver nuevas alertas

## Solución Propuesta

### 1. Hook useWebSocket

```tsx
// frontend/src/hooks/useWebSocket.ts
import { useEffect, useRef, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const queryClient = useQueryClient()
  const { token } = useAuth()

  const connect = useCallback(() => {
    if (!token) return

    const ws = new WebSocket(`${import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws"}`)
    
    ws.onopen = () => {
      // Send JWT token as first message
      ws.send(JSON.stringify({ token }))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      // Handle different message types
      switch (data.type) {
        case "new_alert":
          queryClient.invalidateQueries({ queryKey: ["alerts"] })
          queryClient.invalidateQueries({ queryKey: ["dashboard"] })
          break
        case "alert_read":
          queryClient.invalidateQueries({ queryKey: ["alerts"] })
          break
      }
    }

    ws.onclose = () => {
      // Reconnect after 3 seconds
      setTimeout(connect, 3000)
    }

    wsRef.current = ws
  }, [token, queryClient])

  useEffect(() => {
    connect()
    return () => wsRef.current?.close()
  }, [connect])

  return wsRef
}
```

### 2. Integrar en Layout

```tsx
// frontend/src/components/Layout.tsx
import { useWebSocket } from "@/hooks/useWebSocket"

export function Layout({ children }: { children: React.ReactNode }) {
  useWebSocket() // Connect to WebSocket
  
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### 3. Toast para nuevas alertas

```tsx
// En useWebSocket, mostrar toast cuando llega nueva alerta
ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  
  if (data.type === "new_alert") {
    // Show toast notification
    toast.info("Nueva alerta: " + data.title)
    
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ["alerts"] })
  }
}
```

## Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| `frontend/src/hooks/useWebSocket.ts` | **Crear** hook |
| `frontend/src/components/Layout.tsx` | Integrar WebSocket |
| `frontend/src/components/Topbar.tsx` | Badge se actualiza en tiempo real |

## Criterios de Aceptación

- [ ] Hook useWebSocket creado y funcional
- [ ] WebSocket se conecta al Layout
- [ ] Nuevas alertas se muestran en tiempo real
- [ ] Badge de alertas se actualiza sin refresh
- [ ] Toast muestra nueva alerta (FE-02)
- [ ] Reconexión automática tras desconexión
- [ ] Manejo de errores de WebSocket
- [ ] `npm run lint` pasa

## Notas para el Agente

- El backend ya tiene el WebSocket endpoint
- El WebSocket requiere JWT token como primer mensaje
- No bloquear la UI si WebSocket no está disponible
- La reconexión automática es importante para estabilidad
- Los mensajes son JSON con campo `type`
