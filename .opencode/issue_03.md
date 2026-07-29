## Descripcion

Los archivos subidos se sirven mediante `StaticFiles` montado en `/api/v1/files` SIN autenticacion. Cualquier persona con la URL directa puede acceder a documentos privados (patentes, informes, etc).

## Archivo

- `app/main.py:94`

```python
app.mount("/api/v1/files", StaticFiles(directory=settings.upload_dir), name="files")
```

## Fix sugerido

Reemplazar el `StaticFiles` mount por un endpoint autenticado que sirva archivos:

```python
@router.get("/files/{filename}")
async def get_file(filename: str, current_user: User = Depends(get_current_user)):
    file_path = Path(settings.upload_dir) / filename
    if not file_path.exists():
        raise HTTPException(status_code=404)
    return FileResponse(file_path)
```

## Criterios de aceptacion

- [ ] Archivos solo accesibles con token valido
- [ ] 401 si no hay token
- [ ] `ruff check backend/` pasa
- [ ] `pytest -v` pasa
