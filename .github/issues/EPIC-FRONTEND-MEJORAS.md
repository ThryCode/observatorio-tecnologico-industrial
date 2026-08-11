# Épico: Mejoras del Frontend — Experiencia de Usuario y Funcionalidad

**Etiquetas:** `epic`, `frontend`, `ux`
**Hito:** Q3-Q4 2026
**Dependencias:** EPIC-ROADMAP (Fases 0-3 completadas)
**Agentes disponibles:** frontend-coder, ui-designer, test-writer, code-reviewer, backend-coder

---

## Descripción

Este épico agrupa todas las mejoras necesarias para elevar el frontend de un estado funcional a un nivel de producción profesional. Se enfoca en: completar páginas stub, mejorar la experiencia de usuario, agregar funcionalidades faltantes, y asegurar calidad through testing.

## Estado Actual del Frontend (post 50+ commits)

### Lo que funciona bien
- ✅ 21 páginas con React.lazy() code splitting
- ✅ 18 componentes (12 shadcn/ui primitives)
- ✅ 16 hooks TanStack Query
- ✅ 18 módulos API con mock mode
- ✅ CrudPage genérico reutilizado por 4 entidades
- ✅ ForceGraph2D personalizado (SVG, sin D3)
- ✅ Sistema de permisos por rol
- ✅ PDF export con @react-pdf/renderer
- ✅ Sidebar responsive con drawer móvil
- ✅ Keyboard shortcuts (Cmd+K)
- ✅ Breadcrumb navigation
- ✅ File upload con drag-and-drop
- ✅ Author autocomplete
- ✅ Error boundary global

### Lo que necesita mejora
- ❌ SettingsPage es un mockup estático (no funcional)
- ❌ GraphAnalytics es un placeholder ("Connect Neo4j")
- ❌ Competitiveness y PatentMaps son read-only mínimos
- ❌ Bulletins no tiene CRUD
- ❌ Organizations falta UPDATE
- ❌ Network search deshabilitado
- ❌ Patents no usa CrudPage (duplicación de código)
- ❌ Sin página 404 para rutas desconocidas
- ❌ Sin sistema de toast/notificaciones
- ❌ Sin dark mode (CSS variables existen)
- ❌ Sin i18n (selector de idioma existe pero no funciona)
- ❌ WebSocket integration incompleta
- ❌ PDF export lento (carga todos los datos)
- ❌ Sin componentes shadcn/ui: textarea, dropdown-menu, tooltip, tabs, checkbox, avatar

---

## Fases

### Fase 5 — Core UX (Prioridad Alta)

| Issue | Título | Agente | Depende de |
|-------|--------|--------|------------|
| FE-01 | Página 404 para rutas desconocidas | frontend-coder | — |
| FE-02 | Sistema de toast/notificaciones | ui-designer + frontend-coder | — |
| FE-03 | Loading states consistentes (Skeletons) | ui-designer | — |
| FE-04 | Error boundaries por sección | frontend-coder | — |

### Fase 6 — Completar Páginas Stub (Prioridad Alta)

| Issue | Título | Agente | Depende de |
|-------|--------|--------|------------|
| FE-05 | SettingsPage: hacer funcional | frontend-coder + backend-coder | FE-02 |
| FE-06 | GraphAnalytics: integrar con backend real | frontend-coder + backend-coder | — |
| FE-07 | Competitiveness: agregar filtros e interactividad | frontend-coder | FE-02 |
| FE-08 | PatentMaps: agregar filtros y drill-down | frontend-coder | FE-02 |

### Fase 7 — Consistencia CRUD (Prioridad Media)

| Issue | Título | Agente | Depende de |
|-------|--------|--------|------------|
| FE-09 | Patents: migrar a CrudPage | frontend-coder | — |
| FE-10 | Organizations: agregar UPDATE | frontend-coder + backend-coder | — |
| FE-11 | Bulletins: agregar CRUD completo | frontend-coder + backend-coder | FE-02 |
| FE-12 | Network: habilitar search | frontend-coder | — |

### Fase 8 — Features Faltantes (Prioridad Media)

| Issue | Título | Agente | Depende de |
|-------|--------|--------|------------|
| FE-13 | Dark mode toggle | ui-designer + frontend-coder | — |
| FE-14 | i18n framework (es/en) | frontend-coder | — |
| FE-15 | Real-time updates (WebSocket) | frontend-coder + backend-coder | — |
| FE-16 | Advanced search (Cmd+K mejorado) | frontend-coder | — |

### Fase 9 — Performance y Polish (Prioridad Baja)

| Issue | Título | Agente | Depende de |
|-------|--------|--------|------------|
| FE-17 | PDF export optimizado (streaming) | frontend-coder | — |
| FE-18 | Virtual scrolling para listas grandes | frontend-coder | — |
| FE-19 | Image lazy loading | frontend-coder | — |
| FE-20 | Service worker (offline support) | frontend-coder | — |

### Fase 10 — Testing y Calidad (Prioridad Alta)

| Issue | Título | Agente | Depende de |
|-------|--------|--------|------------|
| FE-21 | Component tests críticos | test-writer | FE-01 a FE-04 |
| FE-22 | E2E tests (Playwright) | test-writer | FE-01 a FE-12 |
| FE-23 | Visual regression (Chromatic) | test-writer | FE-21 |

---

## Estadísticas del Épico

| Métrica | Valor |
|---------|-------|
| **Issues totales** | 23 |
| **Fases** | 6 (Fase 5-10) |
| **Agentes involucrados** | 5 (frontend-coder, ui-designer, test-writer, code-reviewer, backend-coder) |
| **Estimación total** | 30-40 días |
| **Bloqueadores críticos** | Ninguno |

---

## Cómo usar este épico

1. Cada issue tiene una **especificación completa** con archivos, código y criterios de aceptación
2. Los issues de una fase se pueden trabajar en **paralelo** si no tienen dependencias
3. Cada issue puede ser asignado a un desarrollador o a un subagente de opencode
4. Al completar un issue, marcar como done y actualizar la referencia aquí
5. **Recomendación:** Empezar por Fase 5 (Core UX) ya que desbloquea las demás

---

## Referencias

- [EPIC-ROADMAP original](./EPIC-ROADMAP.md) — Fases 0-3 completadas
- [PLAN_MEJORAS_V3.md](../../PLAN_MEJORAS_V3.md) — Plan de mejoras integral
- [AGENTS.md](../../AGENTS.md) — Instrucciones para agentes
- [CHANGELOG.md](../../CHANGELOG.md) — Historial de cambios
