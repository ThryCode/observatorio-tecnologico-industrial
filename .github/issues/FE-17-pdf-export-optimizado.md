# FE-17: PDF Export Optimizado (Streaming)

**Épico:** EPIC-FRONTEND-MEJORAS
**Etiquetas:** `frontend`, `performance`, `enhancement`
**Agente:** frontend-coder
**Dependencias:** Ninguna
**Estimación:** 2 días

---

## Descripción

El componente `FullExportPDF.tsx` carga TODOS los datos de todas las entidades (hasta 200 items por entity) al momento de exportar. Esto es lento y consume mucha memoria. Se necesita optimizar con streaming o paginación.

## Problema Actual

- Carga hasta 200 items por entidad (organizaciones, tech, patentes, etc.)
- Todo se carga en memoria antes de generar el PDF
- Puede causar timeout o crash en datos grandes
- Sin feedback de progreso al usuario

## Solución Propuesta

### 1. Exportación por sección

```tsx
// En FullExportPDF.tsx, cargar datos por sección
const [generating, setGenerating] = useState(false)
const [progress, setProgress] = useState(0)

const handleExport = async () => {
  setGenerating(true)
  
  // Cargar datos secuencialmente
  setProgress(10)
  const orgs = await apiClient.get("/organizations", { params: { per_page: 50 } })
  
  setProgress(25)
  const techs = await apiClient.get("/technologies", { params: { per_page: 50 } })
  
  setProgress(40)
  const patents = await apiClient.get("/patents", { params: { per_page: 50 } })
  
  // ... etc
  
  setProgress(90)
  // Generar PDF
  
  setProgress(100)
  setGenerating(false)
}
```

### 2. Mostrar progreso

```tsx
{generating && (
  <div className="flex items-center gap-2">
    <Loader2 className="h-4 w-4 animate-spin" />
    <span>Generando PDF... {progress}%</span>
  </div>
)}
```

### 3. Limitar items por sección

```tsx
// Reducir de 200 a 50 items por sección
const orgs = await apiClient.get("/organizations", { params: { per_page: 50 } })
```

## Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| `frontend/src/components/FullExportPDF.tsx` | Optimizar carga de datos |

## Criterios de Aceptación

- [ ] PDF genera en menos de 10 segundos
- [ ] No carga más de 50 items por sección
- [ ] Muestra barra de progreso
- [ ] No causa timeout o crash
- [ ] Feedback visual durante generación
- [ ] `npm run lint` pasa

## Notas para el Agente

- @react-pdf/renderer ya está instalado
- La optimización principal es reducir items cargados
- El progreso es una mejora UX simple pero efectiva
- No cambiar la estructura del PDF
