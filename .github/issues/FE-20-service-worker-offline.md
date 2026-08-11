# FE-20: Service Worker (Offline Support)

**Épico:** EPIC-FRONTEND-MEJORAS
**Etiquetas:** `frontend`, `pwa`, `enhancement`
**Agente:** frontend-coder
**Dependencias:** Ninguna
**Estimación:** 3 días

---

## Descripción

La aplicación no tiene soporte offline. En contextos gubernamentales con conectividad intermitente, es importante que los usuarios puedan acceder a datos en caché cuando no hay internet. Se necesita implementar un service worker para cache de assets y datos.

## Problema Actual

- Sin service worker
- Sin cache de assets estáticos
- Sin offline support
- Sin PWA manifest
- Sin fallback para errores de red

## Solución Propuesta

### 1. Configurar Vite PWA

```bash
npm install -D vite-plugin-pwa
```

### 2. Configurar vite.config.ts

```typescript
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt"],
      manifest: {
        name: "Observatorio Tecnológico Industrial",
        short_name: "Observatorio",
        description: "Plataforma de vigilancia tecnológica industrial para el MINDUS",
        theme_color: "#0f172a",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/localhost:8000\/api\/v1\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
            },
          },
        ],
      },
    }),
  ],
})
```

### 3. Offline fallback

```tsx
// frontend/src/components/OfflineFallback.tsx
import { Card } from "@/components/ui/card"
import { WifiOff } from "lucide-react"

export function OfflineFallback() {
  return (
    <Card className="p-8 text-center">
      <WifiOff className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
      <h2 className="mb-2 text-xl font-semibold">Sin conexión</h2>
      <p className="text-muted-foreground">
        No hay conexión a internet. Los datos mostrados pueden no estar actualizados.
      </p>
    </Card>
  )
}
```

## Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| `frontend/package.json` | Agregar `vite-plugin-pwa` |
| `frontend/vite.config.ts` | Configurar PWA |
| `frontend/public/manifest.json` | **Crear** manifest |
| `frontend/public/icon-192.png` | **Crear** icono |
| `frontend/public/icon-512.png` | **Crear** icono |
| `frontend/src/components/OfflineFallback.tsx` | **Crear** componente |
| `frontend/src/App.tsx` | Mostrar fallback offline |

## Criterios de Aceptación

- [ ] vite-plugin-pwa configurado
- [ ] Manifest.json creado
- [ ] Service worker registra automáticamente
- [ ] Assets estáticos cacheados
- [ ] API responses cacheadas (NetworkFirst)
- [ ] Offline fallback mostrado sin conexión
- [ ] Iconos PWA creados
- [ ] Instalable en dispositivos móviles
- [ ] `npm run lint` pasa
- [ ] `npm run build` funciona

## Notas para el Agente

- vite-plugin-pwa maneja todo automáticamente
- El workbox configura las estrategias de cache
- NetworkFirst para API (intenta red, fallback a cache)
- CacheFirst para assets estáticos
- No es necesario implementar un service worker manualmente
