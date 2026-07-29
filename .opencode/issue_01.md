## Descripcion

`IndicatorService.list()` serializa solo `id` y `code` al guardar en cache (Redis), pero al leer intenta reconstruir `Indicator(...)` faltando campos obligatorios (`name`, `unit`, `value`, `source`, `period`). **La segunda request a GET /api/v1/indicators siempre da 500 si Redis esta activo.**

## Archivos

- `app/services/indicator_service.py:28` — serializacion incompleta
- `app/services/indicator_service.py:60-63` — deserializacion con campos faltantes

## Reproduccion

1. Hacer GET /api/v1/indicators (primera request — funciona, guarda cache)
2. Hacer GET /api/v1/indicators (segunda request — 500 Internal Server Error)

## Fix sugerido

Opcion A: Serializar TODOS los campos del modelo. Opcion B: No cachear list results. Opcion C: Usar `IndicatorSchema.model_validate(i).model_dump(mode="json")`.

## Criterios de aceptacion

- [ ] Segunda request a GET /api/v1/indicators no da 500
- [ ] Cache devuelve datos completos con todos los campos
- [ ] `ruff check backend/` pasa
- [ ] `pytest -v` pasa
