# Contributing to Observatorio Tecnológico Industrial

¡Gracias por contribuir al Observatorio Tecnológico Industrial del MINDUS!
Este documento establece las pautas para contribuir al proyecto.

> **Idioma:** El código y los comentarios técnicos van en inglés. Los campos de dominio (nombre, siglas, tipo, descripcion) y la documentación para la contraparte cubana van en español.

---

## Reportar bugs

1. Revisa los [issues existentes](https://github.com/ThryCode/observatorio-tecnologico-industrial/issues) para evitar duplicados.
2. Usa la plantilla de **Bug Report** en `.github/ISSUE_TEMPLATE/bug_report.md`.
3. Incluye:
   - Pasos para reproducir
   - Comportamiento esperado vs. actual
   - Logs relevantes (consola, loguru)
   - Versiones de Python, Node.js, SQLite, Neo4j, Redis
4. Etiqueta el issue como `bug`.

## Solicitar funcionalidades

1. Abre un issue con la plantilla **Feature Request** en `.github/ISSUE_TEMPLATE/feature_request.md`.
2. Describe el problema que resuelve y el contexto de uso en MINDUS.
3. Si aplica, incluye mockups o referencias a normativas cubanas.
4. Etiqueta el issue como `enhancement`.

---

## Development workflow

### 1. Clonar y configurar

```bash
git clone https://github.com/ThryCode/observatorio-tecnologico-industrial.git
cd observatorio-tecnologico-industrial
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

> Si `venv\Scripts\activate` falla por execution policy:
> ```powershell
> .\venv\Scripts\python.exe -m pip install -r requirements.txt
> .\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
> ```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Ejecutar tests

```bash
# Backend (pytest, 90+ tests)
cd backend && pytest -v

# Frontend (Vitest, 10+ tests)
cd frontend && npm test
```

### 5. Linting (obligatorio antes de commit)

```bash
ruff check backend/
npm run lint
```

---

## Code style

### Backend (Python)

| Regla | Estándar |
|---|---|
| Linter | Ruff (line-length=120, target py311) |
| Rules | E, F, W, I, N, UP, B, SIM |
| Type hints | Obligatorios en todas las funciones |
| Async | Toda operación de BD debe ser async/await |
| Schemas | Pydantic v2 para toda validación |
| Errors | Usar `AppException` |
| Pagination | `PaginatedResponse[T]` para listas |
| Logging | loguru (no print ni logging stdlib) |
| Naming | Código en inglés, campos de dominio en español |

### Frontend (TypeScript/React)

| Regla | Estándar |
|---|---|
| Linter | ESLint (configuración en `eslint.config.js`) |
| Strict mode | `strict: true` en tsconfig |
| Path alias | `@/` → `./src/` |
| Components | Functional + forwardRef para UI primitives |
| CSS | Tailwind exclusivamente, usar `cn()` utility |
| Server state | TanStack Query para toda data remota |
| Code splitting | `React.lazy()` + `Suspense` por ruta |
| Vendor splitting | `manualChunks` en Vite config |

---

## Branch naming convention

| Prefix | Uso |
|---|---|
| `feat/` | Nueva funcionalidad |
| `fix/` | Corrección de bugs |
| `docs/` | Cambios en documentación |
| `chore/` | Mantenimiento, CI, config |

Ejemplos: `feat/patent-search`, `fix/login-redirect`, `docs/api-auth`.

## Commit message convention

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add patent search by IPC code
fix: resolve 401 on token refresh
docs: update API endpoint table in README
chore: bump ruff to 0.6.0
```

Tipos permitidos: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`, `ci`.

---

## Pull Request process

1. Crea un branch desde `main` siguiendo la convención de nombres.
2. Desarrolla y commitea usando conventional commits.
3. Antes de abrir el PR, ejecuta:
   ```bash
   ruff check backend/
   npm run lint
   pytest -v
   npm test
   alembic upgrade head   # si hay migraciones nuevas
   ```
4. Abre el PR usando la plantilla en `.github/PULL_REQUEST_TEMPLATE.md`.
5. Asigna revisores del equipo MINDUS.
6. No se mergea sin al menos una aprobación y CI verde.

---

## Testing expectations

| Suite | Comando | Cobertura esperada |
|---|---|---|
| Backend tests | `pytest -v` | 90+ tests, sin `--timeout` flag |
| Frontend tests | `npm test` (Vitest) | 10+ tests |
| Backend lint | `ruff check backend/` | Sin errores |
| Frontend lint | `npm run lint` | Sin errores |

> **Nota:** `pytest-timeout` no está instalado. No uses el flag `--timeout`.

---

## Three-tier boundaries

Consulta [`AGENTS.md`](./AGENTS.md) para la lista completa de reglas **Always do**, **Ask first** y **Never do**. Algunas reglas críticas:

- **Nunca** uses Docker. Todos los servicios corren nativos en Windows 10.
- **Nunca** commitees `.env` ni secrets.
- **Nunca** edites migraciones de Alembic ya commiteadas.
- **Siempre** usa parámetros en Cypher (nunca string concatenation).

---

## Preguntas

Si tienes dudas, abre un issue con la etiqueta `question` o contacta al equipo interno de desarrollo del MINDUS.