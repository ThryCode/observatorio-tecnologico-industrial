# F3-17: Actualizar README.md

**Etiquetas:** `fase-3`, `documentacion`
**Hito:** Fase 3 — Producción
**Depende de:** F3-15 (Deploy/backup docs)
**Subagente:** `docs-writer`

---

## Descripción

El README.md actual tiene 387 líneas y está bastante completo, pero faltan secciones importantes después de los cambios realizados en fases anteriores.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `README.md` | Agregar/quitar secciones |

## Cambios necesarios

### 1. Sección "Primeros pasos" — actualizar

Después de F0-02 (Alembic único mecanismo), agregar el paso de migración:

```diff
 ## Inicio rápido (Windows nativo)
 
 ```powershell
 # 1. Clonar + instalar dependencias
 ...
 # 2. Configurar base de datos
+alembic upgrade head
 # 3. Iniciar backend
 uvicorn app.main:app --reload --port 8000
```

### 2. Sección "CI/CD" — agregar

Después de F0-05 (CI workflow):

```markdown
## Integración Continua

Este proyecto usa GitHub Actions para CI. El workflow `.github/workflows/ci.yml` ejecuta:

| Job | Comandos |
|-----|----------|
| **backend** | `ruff check`, `pytest -v` (con PostgreSQL 15 service container) |
| **frontend** | `npm run lint`, `npm test`, `npm run build` |

El badge de estado está en la parte superior del README.
```

### 3. Referencia a documentación

```markdown
## Documentación adicional

- [`docs/production-guide.md`](docs/production-guide.md) — Guía de deploy en producción
- [`docs/backup-recovery.md`](docs/backup-recovery.md) — Backup y recuperación de datos
```

### 4. Sección "Issues conocidos" — actualizar

Marcar como resueltos los issues que se hayan completado:

```markdown
## Issues conocidos (de la auditoría)

- ~~`.env` file is committed~~ ✅ Resuelto (F0-01)
- ~~~~No health check endpoint~~ ✅ Resuelto
- ~~No rate limiting~~ ✅ Resuelto
- ~~No frontend tests~~ ✅ Resuelto (Vitest + happy-dom, 10 tests)
- `alembic upgrade head` obligatorio antes de arrancar
- No deployment strategy documented (ver docs/production-guide.md)
- No backup procedures (ver docs/backup-recovery.md)
```

## Criterios de aceptación

- [ ] README incluye paso `alembic upgrade head` en inicio rápido
- [ ] README tiene sección de CI/CD con badge funcional
- [ ] README referencia documentación adicional (production-guide, backup-recovery)
- [ ] Sección de issues conocidos actualizada
- [ ] Markdown válido (sin errores de sintaxis)
