## Issue agrupado: Bugs de prioridad alta en backend y frontend

### 4a) ForceGraph2D: variable `r` no definida

**Archivo:** `frontend/src/components/ForceGraph2D.tsx:152`

```typescript
r={r}  // ReferenceError: r is not defined
```

Deberia ser `RADIUS_ORG` (constante definida como 32 en el mismo archivo). Causa que el grafo de conocimiento no renderice nodos.

**Fix:** Cambiar `r` por `RADIUS_ORG`.

---

### 4b) `user_id: str` deberia ser UUID

**Archivo:** `app/api/v1/auth.py:149,161`

Los endpoints `POST /auth/{user_id}/approve` y `POST /auth/{user_id}/reject` usan `user_id: str` como path param. Si se pasa un string no-UUID, la query a DB falla con 500. Deberia ser `user_id: UUID` para que FastAPI valide automaticamente.

---

### 4c) PatentMaps barra de progreso con maximo hardcodeado

**Archivo:** `frontend/src/pages/PatentMaps.tsx:48`

```typescript
const maxCount = Math.max(...counts, 34); // 34 hardcodeado como fallback
```

Si el dataset tiene menos items, la barra mas larga representa 34 en vez del maximo real. Si tiene mas de 34, se desborda.

**Fix:** Usar `Math.max(...counts, 1)` y que la escala sea proporcional al maximo real.

---

### 4d) CompetitiveIndex chart con paises hardcodeados

**Archivo:** `frontend/src/pages/Competitiveness.tsx:34-37`

```typescript
{data?.map((item: { pais: string; indice: number }) => (
  <Bar dataKey="indice" name={item.pais} fill={palette[i % palette.length]} />
))}
```

`i` es la variable del loop padre — si se anidan loops o cambia la estructura, el indice no corresponde. Ademas, los `<Bar>` deberian generarse de las claves del dataset, no de un mapeo manual.

**Fix:** Generar `<Bar>` dinamicamente desde `Object.keys(data[0]).filter(...)`.

---

### 4e) Fechas como string en vez de `date` en research publications

**Archivo:** `app/api/v1/research_publications.py:27-28`

```python
publication_date: str | None = None
registration_date: str | None = None
```

Deberian ser `date | None` para validacion automatica de formato por Pydantic.

---

### 4f) `total` puede ser `None` en auth_service

**Archivo:** `app/services/auth_service.py:130`

```python
total = (await db.execute(count_query)).scalar()
total or 0  # Si total es None, crashea al hacer paginacion
```

**Fix:** `total = (await db.execute(count_query)).scalar() or 0`

---

## Criterios de aceptacion generales

- [ ] Cada bug tiene su commit individual
- [ ] `ruff check backend/` pasa
- [ ] `npm run lint` pasa
- [ ] `tsc --noEmit` pasa
- [ ] `pytest -v` pasa
