## Descripcion

`IndicatorService.list()` serializa solo `id` y `code` al guardar en cache (Redis), pero al leer intenta reconstruir `Indicator(...)` faltando campos obligatorios (`name`, `unit`, `value`, `source`, `period`). **La segunda request a GET /api/v1/indicators siempre da 500 si Redis esta activo.**

## Archivos

- `app/services/indicator_service.py:28` — serializacion incompleta
- `app/services/indicator_service.py:60-63` — deserializacion con campos faltantes

## Reproduccion

1. Hacer GET /api/v1/indicators (primera request — funciona, guarda cache)
2. Hacer GET /api/v1/indicators (segunda request — 500 Internal Server Error)

## Causa raiz

```python
# indicator_service.py:28 — solo guarda id y code:
serialized = [
    i.to_dict() if hasattr(i, "to_dict") else {"id": str(i.id), "code": i.code}
    for i in items
]

# indicator_service.py:60-63 — intenta construir con datos incompletos:
return [Indicator(**item) for item in cached["items"]], cached["total"]
```

## Fix sugerido

Opcion A: Serializar TODOS los campos del modelo:
```python
serialized = [{
    "id": str(i.id), "code": i.code, "name": i.name,
    "value": str(i.value), "unit": i.unit, "source": i.source,
    "period": i.period.value, "sector_codigo": i.sector_codigo,
    "description": i.description,
    "created_at": i.created_at.isoformat() if i.created_at else None,
    "updated_at": i.updated_at.isoformat() if i.updated_at else None,
} for i in items]
```

Opcion B: No cachear list results (mas simple, menos bug-prone).

Opcion C: Usar `IndicatorSchema.model_validate(i).model_dump(mode="json")` si existe un schema.

## Criterios de aceptacion

- [ ] Segunda request a GET /api/v1/indicators no da 500
- [ ] Cache devuelve datos completos con todos los campos
- [ ] `ruff check backend/` pasa
- [ ] `pytest -v` pasa
