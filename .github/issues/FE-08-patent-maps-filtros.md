# FE-08: PatentMaps — Agregar Filtros y Drill-Down

**Épico:** EPIC-FRONTEND-MEJORAS
**Etiquetas:** `frontend`, `ux`, `enhancement`
**Agente:** frontend-coder
**Dependencias:** FE-02 (sistema toast)
**Estimación:** 2 días

---

## Descripción

`PatentMaps.tsx` es actualmente una implementación mínima (60 líneas) que muestra un gráfico de barras horizontal (patentes por tecnología) y barras de progreso resumen, sin filtros, sin interactividad, y sin drill-down.

## Problema Actual

- Solo muestra gráfico de barras horizontal estático
- Sin filtros por sector, país o período
- Sin tabla de datos
- Sin drill-down a detalles de patentes
- Sin loading state

## Solución Propuesta

### 1. Filtros

```tsx
<div className="flex gap-4 mb-6">
  <Select value={sector} onValueChange={setSector}>
    <SelectTrigger className="w-[200px]">
      <SelectValue placeholder="Sector" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">Todos</SelectItem>
      {sectors.map(s => (
        <SelectItem key={s.codigo} value={s.codigo}>{s.nombre}</SelectItem>
      ))}
    </SelectContent>
  </Select>

  <Select value={country} onValueChange={setCountry}>
    <SelectTrigger className="w-[150px]">
      <SelectValue placeholder="País" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">Todos</SelectItem>
      <SelectItem value="CU">Cuba</SelectItem>
      <SelectItem value="US">EE.UU.</SelectItem>
      <SelectItem value="CN">China</SelectItem>
      <SelectItem value="JP">Japón</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### 2. Gráfico y tabla side-by-side

```tsx
<div className="grid gap-6 md:grid-cols-2">
  {/* Gráfico */}
  <Card className="p-6">
    <h3 className="mb-4 text-lg font-semibold">Patentes por Tecnología</h3>
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} layout="vertical">
        <XAxis type="number" />
        <YAxis type="category" dataKey="technology" width={150} />
        <Tooltip />
        <Bar dataKey="total" fill="hsl(var(--primary))" />
      </BarChart>
    </ResponsiveContainer>
  </Card>

  {/* Tabla */}
  <Card className="p-6">
    <h3 className="mb-4 text-lg font-semibold">Detalle</h3>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tecnología</TableHead>
          <TableHead>País</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Tendencia</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={`${row.technology}-${row.country}`}>
            <TableCell>{row.technology}</TableCell>
            <TableCell>{row.country}</TableCell>
            <TableCell>{row.total_patents}</TableCell>
            <TableCell>
              <Badge variant={row.trend === "up" ? "default" : "secondary"}>
                {row.trend === "up" ? "↑" : "↓"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Card>
</div>
```

## Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| `frontend/src/pages/PatentMaps.tsx` | Reescritura completa |
| `frontend/src/hooks/usePatentMaps.ts` | Agregar filtros al query |

## Criterios de Aceptación

- [ ] Filtro por sector funciona
- [ ] Filtro por país funciona
- [ ] Gráfico de barras horizontal muestra datos filtrados
- [ ] Tabla de datos detallada
- [ ] Tendencia (up/down) mostrada con badge
- [ ] Loading state con skeleton
- [ ] Empty state cuando no hay datos
- [ ] Responsive
- [ ] `npm run lint` pasa

## Notas para el Agente

- Usar Recharts (ya instalado)
- Seguir patrón de `Competitiveness.tsx` (FE-07)
- La API ya soporta filtros por sector y país
- El componente `Badge` ya está en `@/components/ui/badge`
