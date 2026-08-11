# FE-23: Visual Regression (Chromatic)

**Épico:** EPIC-FRONTEND-MEJORAS
**Etiquetas:** `frontend`, `testing`, `quality`
**Agente:** test-writer
**Dependencias:** FE-21 (component tests)
**Estimación:** 3 días

---

## Descripción

Los tests actuales verifican funcionalidad pero no apariencia visual. Se necesita detectar cambios visuales no intencionados (regresiones visuales) que puedan romper la UI. Chromatic es la herramienta estándar para esto, integrada con Storybook.

## Problema Actual

- Sin detección de cambios visuales
- Sin capturas de referencia
- Sin comparación entre versiones
- Cambios de CSS pueden romper UI sin ser detectados

## Solución Propuesta

### 1. Instalar Storybook

```bash
npx storybook@latest init
```

### 2. Crear stories para componentes críticos

```tsx
// frontend/src/components/stories/Button.stories.tsx
import type { Meta, StoryObj } from "@storybook/react"
import { Button } from "@/components/ui/button"

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Button>

export const Default: Story = {
  args: {
    children: "Button",
  },
}

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary",
  },
}

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Delete",
  },
}
```

### 3. Configurar Chromatic

```bash
npm install -D chromatic
npx chromatic --project-token=<your-token>
```

### 4. GitHub Action para Chromatic

```yaml
# .github/workflows/chromatic.yml
name: Chromatic
on: push
jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run storybook:build
      - uses: chromaui/action@latest
        with:
          projectToken: ${{ secrets.CHROMATIC_TOKEN }}
          exitZeroOnChanges: false
```

## Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| `frontend/package.json` | Agregar `@storybook/react`, `chromatic` |
| `frontend/.storybook/main.ts` | **Crear** configuración Storybook |
| `frontend/src/components/stories/*.stories.tsx` | **Crear** stories |
| `.github/workflows/chromatic.yml` | **Crear** workflow |

## Criterios de Aceptación

- [ ] Storybook instalado y configurado
- [ ] Stories para componentes críticos (Button, Card, Badge, Dialog)
- [ ] Chromatic configurado con project token
- [ ] GitHub Action ejecuta Chromatic en cada push
- [ ] Capturas de referencia generadas
- [ ] Cambios visuales detectados automáticamente
- [ ] `npm run storybook` funciona localmente

## Notas para el Agente

- Storybook es opcional pero recomendado para proyectos con UI compleja
- Chromatic tiene tier gratuito para proyectos open source
- Las stories son documentación viva de los componentes
- No es necesario storybook completo — empezar por componentes UI
- Esta es la última fase — priorizar si hay tiempo
