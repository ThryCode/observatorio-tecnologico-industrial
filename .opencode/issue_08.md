## Descripcion

Varias funcionalidades no tienen tests automatizados. Esto aumenta el riesgo de regresiones al refactorizar.

## Endpoints sin tests

| Endpoint | Archivo de ruta |
|----------|----------------|
| `GET/POST /api/v1/bulletins` | `app/api/v1/bulletins.py` |
| `GET /api/v1/competitiveness` | `app/api/v1/competitiveness.py` |
| `GET /api/v1/patent-maps` | `app/api/v1/patent_maps.py` |
| `GET /api/v1/research-publications` | `app/api/v1/research_publications.py` |
| `GET /api/v1/audit-logs` | `app/api/v1/audit_logs.py` |
| `POST /api/v1/upload` | `app/api/v1/uploads.py` |
| `POST /auth/register/public` | `app/api/v1/auth.py` |

## Tests existentes (referencia)

Mirar `tests/test_patents.py` como referencia de estilo — usa `async def`, fixtures de SQLAlchemy, `httpx.AsyncClient`, y asserts sobre `response.status_code` + `response.json()`.

## Formato esperado

Cada archivo de test debe:
- Usar `async def` + `await`
- Usar fixture `async_client` (ya definido en `conftest.py`)
- Probar caso exitoso (200/201)
- Probar caso 404 si aplica
- Probar caso 401/403 si hay control de acceso
- Seguir naming: `test_create_xxx`, `test_get_xxx`, `test_update_xxx`, `test_delete_xxx`

## Criterios de aceptacion

- [ ] bulletins: test_list, test_create, test_get_by_id, test_update, test_delete
- [ ] competitiveness: test_list
- [ ] patent_maps: test_list
- [ ] research_publications: test_list
- [ ] audit_logs: test_list (solo superuser)
- [ ] uploads: test_upload_file, test_upload_unauthorized
- [ ] auth: test_register_public
- [ ] `pytest -v` — todos pasan
- [ ] Cobertura minima: lineas nuevas cubiertas
