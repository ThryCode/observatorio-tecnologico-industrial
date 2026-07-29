## Descripcion

Varios componentes, hooks y archivos del frontend estan importados pero nunca usados (dead code). Incrementan el bundle size y confunden a nuevos desarrolladores.

## Lista

### Componentes sin uso (importados en 0 lugares):

| Componente | Archivo |
|-----------|---------|
| `GraficoPatentes` | `frontend/src/components/GraficoPatentes.tsx` |
| `AlertasTable` | `frontend/src/components/AlertasTable.tsx` |
| `Header` | `frontend/src/components/Header.tsx` |
| `Pill` | `frontend/src/components/Pill.tsx` |
| `Tabs` | `frontend/src/components/Tabs.tsx` |

### Hooks sin uso:

| Hook | Archivo | Nota |
|-----|---------|------|
| `useWebSocket` | `frontend/src/hooks/useWebSocket.ts` | Se creo como parte del issue #30 pero no se integro en ninguna pagina |

### Archivos adicionales:

- `frontend/src/api/mockApi.ts` — logica Mock usada solo cuando `VITE_USE_MOCK=true`. Podria archivarse si no se planea usar mas.

### Backend:

- `app/services/file_service.py:54-55` — `delete_file()` es sync bloqueante y nunca se llama desde ningun endpoint

## Fix sugerido

1. Eliminar los archivos de componentes/hooks no usados (o moverlos a `_archive/`)
2. Si se planea usar `useWebSocket` en el futuro, dejarlo pero agregar TODO comment
3. Eliminar `delete_file()` de file_service.py o convertirlo a async

## Criterios de aceptacion

- [ ] `grep -r "GraficoPatentes\|AlertasTable\|useWebSocket" frontend/src/pages/ frontend/src/components/` (post-cleanup) no muestra resultados
- [ ] `npm run lint` pasa
- [ ] `tsc --noEmit` pasa
- [ ] Build de produccion (`npm run build`) funciona
