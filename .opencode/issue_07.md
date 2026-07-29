## Descripcion

Varias inconsistencias en patrones de paginacion, ordenamiento y busqueda entre endpoints.

## 7a) Paginacion: offset/limit vs page/per_page

**Problema:** Algunos servicios usan `offset/limit` y otros `page/per_page`.

Ejemplos:
- `PatentService` usa `offset/limit`
- `AuditService` usa `page/per_page`

**Fix:** Unificar a `offset/limit` (estandar en SQLAlchemy) y convertir en los endpoints si se prefiere `page/per_page` en la API.

---

## 7b) Falta de ORDER BY en varias queries

**Archivos sin orden explicito:**
- `app/services/regulation_service.py`
- `app/services/bulletin_service.py`
- `app/services/competitiveness_service.py`
- `app/services/alert_service.py`

**Efecto:** El orden de resultados es indeterminado (depende del planificador de PostgreSQL). Los tests que asumen orden fallan intermitentemente.

**Fix:** Agregar `order_by(Model.created_at.desc())` como default en todos los list().

---

## 7c) Busqueda inconsistente: servidor vs cliente

**Problema:** Patents busca en servidor (`search` query param en GET /api/v1/patents), pero otras entidades (Technologies, Organizations, Indicators) filtran en cliente (fetch all y filtran con JS).

**Efecto:** Las entidades con filtrado cliente se vuelven lentas con >100 registros; Patents no permite busqueda combinada con otros filtros.

**Fix:** Implementar `?search=` en todos los endpoints o en ninguno. Estandarizar.

---

## 7d) mark_read requiere ADMIN_MINDUS

**Archivo:** `app/api/v1/alerts.py:94`

```python
@router.patch("/{alert_id}/read", dependencies=[Depends(require_role("ADMIN_MINDUS"))])
```

Los usuarios no pueden marcar sus propias alertas como leidas a menos que sean ADMIN. Deberia permitirse a cualquier usuario autenticado (validando que la alerta le pertenezca).

**Fix:**
```python
@router.patch("/{alert_id}/read")
async def mark_read(alert_id: UUID, current_user: User = Depends(get_current_user)):
    alert = await alert_service.get_by_id(db, alert_id)
    if alert.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="No puedes marcar alertas de otro usuario")
    await alert_service.mark_read(db, alert_id)
```

---

## Criterios de aceptacion

- [ ] Todos los endpoints usan el mismo esquema de paginacion
- [ ] Todos los list() tienen ORDER BY explicito
- [ ] Busqueda estandarizada (server-side o client-side, no ambos)
- [ ] Usuarios pueden marcar sus propias alertas como leidas
- [ ] `pytest -v` pasa
