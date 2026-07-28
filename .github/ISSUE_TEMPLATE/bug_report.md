---
name: Bug Report
description: Reportar un error
labels: ["bug"]
---

## Describe el bug

<!-- Descripción clara y concisa del error -->

## Para reproducir

Pasos para reproducir el comportamiento:

1. Ir a '...'
2. Click en '....'
3. Scroll hasta '....'
4. Ver error

## Comportamiento esperado

<!-- Descripción clara y concisa de lo que esperabas que ocurriera -->

## Capturas de pantalla

<!-- Si aplica, agrega capturas para explicar el problema -->

## Entorno

- **SO:** <!-- ej: Windows 10 Pro 22H2 -->
- **Navegador:** <!-- ej: Chrome 120, Firefox 121 -->
- **Versión del backend:** <!-- commit hash o tag -->
- **Versión del frontend:** <!-- commit hash o tag -->
- **Servicios:** PostgreSQL 15 / Neo4j 5 / Redis 5

## Contexto adicional

<!-- Cualquier otro contexto relevante: logs, errores en consola, etc. -->

## Checklist

- [ ] Backend tests pasan (`pytest -v`)
- [ ] Frontend tests pasan (`npx vitest run`)
- [ ] Ruff pasa (`ruff check backend/`)
- [ ] `npm run lint` pasa (si aplica)
- [ ] No incluye `.env` ni secrets
