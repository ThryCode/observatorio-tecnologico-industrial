## Descripcion

`AlertsPage.tsx` tiene un `useEffect` que ejecuta `markAllRead.mutate()` al montar el componente. Esto marca **TODAS** las alertas como leidas cada vez que el usuario visita la pagina de Alertas, destruyendo el tracking de no-leidas.

## Archivo

- `frontend/src/pages/AlertsPage.tsx:83-85`

## Reproduccion

1. Tener alertas sin leer
2. Navegar a /alerts
3. Volver al dashboard — todas las alertas aparecen como leidas
4. Las alertas nuevas se marcan como leidas automaticamente al visitar la pagina

## Fix sugerido

Eliminar el useEffect que llama `markAllRead.mutate()`. Dejar que el usuario marque como leidas manualmente o mediante un boton explicito "Marcar todas como leidas".

## Criterios de aceptacion

- [ ] Navegar a /alerts NO marca todas las alertas como leidas
- [ ] Boton "Marcar todas como leidas" funciona correctamente
- [ ] `npm run lint` pasa
- [ ] `tsc --noEmit` pasa
