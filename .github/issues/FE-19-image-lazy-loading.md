# FE-19: Image Lazy Loading

**Épico:** EPIC-FRONTEND-MEJORAS
**Etiquetas:** `frontend`, `performance`, `enhancement`
**Agente:** frontend-coder
**Dependencias:** Ninguna
**Estimación:** 0.5 días

---

## Descripción

Las imágenes en la aplicación (avatars, logotipos, archivos adjuntos) se cargan todas al mismo tiempo, incluso las que están fuera del viewport. Se necesita implementar lazy loading para mejorar el rendimiento.

## Problema Actual

- Imágenes se cargan al montar el componente
- Alto consumo de ancho de banda inicial
- Lento en conexiones lentas
- Sin placeholder mientras carga

## Solución Propuesta

### 1. Componente LazyImage

```tsx
// frontend/src/components/LazyImage.tsx
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  fallback?: string
}

export function LazyImage({ src, alt, fallback, className, ...props }: LazyImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && imgRef.current) {
          imgRef.current.src = src
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [src])

  if (error && fallback) {
    return <div className={cn("flex items-center justify-center bg-muted", className)}>{fallback}</div>
  }

  return (
    <img
      ref={imgRef}
      alt={alt}
      className={cn("transition-opacity", loaded ? "opacity-100" : "opacity-0", className)}
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
      {...props}
    />
  )
}
```

### 2. Uso en componentes

```tsx
// En lugar de <img src={url} />
<LazyImage
  src={url}
  alt="Descripción"
  className="h-10 w-10 rounded-full"
  fallback={<div className="h-10 w-10 rounded-full bg-muted" />}
/>
```

## Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| `frontend/src/components/LazyImage.tsx` | **Crear** componente |
| `frontend/src/pages/Network.tsx` | Usar LazyImage para avatares |
| `frontend/src/pages/Organizations.tsx` | Usar LazyImage para logos |
| `frontend/src/pages/Patents.tsx` | Usar LazyImage para archivos adjuntos |

## Criterios de Aceptación

- [ ] LazyImage componente creado
- [ ] Usa IntersectionObserver para detectar viewport
- [ ] Muestra placeholder mientras carga
- [ ] Maneja errores de carga
- [ ] Transición suave al cargar
- [ ] Funciona en listas largas
- [ ] `npm run lint` pasa

## Notas para el Agente

- IntersectionObserver es soportado por todos los navegadores modernos
- El fallback es opcional pero recomendado
- No es necesario para imágenes above-the-fold
- El componente es simple y no requiere librerías externas
