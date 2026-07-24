# F3-14: Branch protection + PR template

**Etiquetas:** `fase-3`, `devops`, `github`
**Hito:** Fase 3 — Producción
**Depende de:** Ninguna
**Subagente:** `docs-writer`

---

## Descripción

Configurar protección de rama `main` en GitHub y crear un template para Pull Requests para estandarizar las contribuciones.

## Archivos a crear

| Archivo | Propósito |
|---------|-----------|
| `.github/PULL_REQUEST_TEMPLATE.md` | Template para PRs |

## Configuración manual en GitHub

La protección de rama NO puede configurarse via archivos en el repo; debe hacerse en Settings > Branches del repositorio de GitHub. Configuración recomendada:

| Regla | Valor |
|-------|-------|
| **Branch** | `main` |
| **Require a pull request before merging** | ✅ |
| **Required approvals** | 1 |
| **Dismiss stale reviews** | ✅ |
| **Require status checks** | ✅ (CI / backend, CI / frontend) |
| **Require branches to be up to date** | ✅ |
| **Require conversation resolution** | ✅ |
| **Allow force pushes** | ❌ |
| **Allow deletions** | ❌ |

## Especificación técnica

### Crear `.github/PULL_REQUEST_TEMPLATE.md`

```markdown
# Pull Request

## Fase / Issue relacionada
<!-- Ej: F0-01, F1-07, etc. -->

## Descripción
<!-- Explica qué hace este PR y por qué es necesario -->

## Cambios principales
<!-- Lista de cambios con archivos afectados -->
- [ ] Archivo A: ...
- [ ] Archivo B: ...

## Tipo de cambio
- [ ] Bug fix
- [ ] Nueva funcionalidad
- [ ] Refactor
- [ ] Documentación
- [ ] Tests
- [ ] Configuración / CI

## Cómo se probó
<!-- Comandos ejecutados y resultados -->

## Checklist
- [ ] `ruff check backend/` pasa (si aplica)
- [ ] `npm run lint` pasa (si aplica)
- [ ] `pytest -v` pasa (si aplica)
- [ ] `npm test` pasa (si aplica)
- [ ] `alembic upgrade head` funciona (si aplica)
- [ ] No se commitean `.env` ni secrets

## Screenshots (si aplica)

## Notas adicionales
```

## Criterios de aceptación

- [ ] `.github/PULL_REQUEST_TEMPLATE.md` existe
- [ ] Template incluye: issue relacionado, descripción, checklist de calidad, tipo de cambio
- [ ] Checklist incluye verificación de lint, tests, migraciones y secrets

## Riesgos

- **Ninguno**: No afecta el código en ejecución.
- **Nota**: Branch protection requiere acceso de admin al repo en GitHub (no configurable via archivos).
