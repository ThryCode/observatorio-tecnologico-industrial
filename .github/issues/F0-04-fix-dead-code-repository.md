# F0-04: Fix código muerto en graph/repository.py

**Etiquetas:** `fase-0`, `backend`, `neoj4`, `bug`
**Hito:** Fase 0 — Estabilización
**Depende de:** Ninguna
**Subagente:** `backend-coder`

---

## Descripción

En `backend/app/graph/repository.py:322` existe la siguiente línea:

```python
"date": str(ind.date) if hasattr(ind, 'date') and ind.date else None,
```

El modelo `Indicator` (definido en `backend/app/models/indicator.py`) **no tiene un campo `date`**. El `hasattr()` evita un crash, pero el valor siempre será `None`. Es código muerto de una versión anterior del modelo.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `backend/app/graph/repository.py` (línea 322) | Reemplazar código muerto |

## Especificación técnica

### Opción recomendada: Reemplazar con `created_at`

En lugar de eliminar la línea (que es válido pero pierde info temporal en el grafo), reemplazar con el campo `created_at` que sí existe en `Indicator` (heredado de `TimestampMixin`).

**Cambio:**

```diff
-            "date": str(ind.date) if hasattr(ind, 'date') and ind.date else None,
+            "created_at": str(ind.created_at) if ind.created_at else None,
```

Esto permite consultas temporales en Neo4j como "indicadores creados en los últimos 30 días".

### Alternativa: Eliminar la línea

Si se prefiere mantener el código limpio, simplemente eliminar la línea. El diccionario `props` pasará de tener 9 a 8 keys sin pérdida de funcionalidad real (ya que `date` siempre era `None`).

## Criterios de aceptación

- [ ] La línea 322 de `repository.py` ya no referencia `ind.date`
- [ ] `ruff check backend/` pasa sin errores
- [ ] `pytest -v` pasa (específicamente `test_graph.py` si existe)

## Riesgos

- **Ninguno**: Es código que siempre devolvía `None`. Cero impacto funcional.
