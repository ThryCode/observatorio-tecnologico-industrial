# FE-07: Competitiveness — Agregar Filtros e Interactividad

**Épico:** EPIC-FRONTEND-MEJORAS
**Etiquetas:** `frontend`, `ux`, `enhancement`
**Agente:** frontend-coder
**Dependencias:** FE-02 (sistema toast)
**Estimación:** 2 días

---

## Descripción

`Competitiveness.tsx` es actualmente una implementación mínima (45 líneas) que muestra un gráfico de barras comparativo (Cuba vs Chile/México/Brasil) sin filtros, sin tabla de datos, y sin drill-down. Se necesita mejorar para ser una herramienta de análisis útil.

## Problema Actual

- Solo muestra un gráfico de barras estático
- Sin filtros por sector, período o país
- Sin tabla de datos detallada
- Sin drill-down a detalles
- Sin exportación
- Sin loading state

## Solución Propuesta

### 1. Filtros

```tsx
// Filtros en la parte superior
<div className="flex gap-4 mb-6">
  <Select value={sector} onValueChange={setSector}>
    <SelectTrigger className="w-[200px]">
      <SelectValue placeholder="Sector" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">Todos los sectores</SelectItem>
      {sectors.map(s => (
        <SelectItem key={s.codigo} value={s.codigo}>{s.nombre}</SelectItem>
      ))}
    </SelectContent>
  </Select>

  <Select value={period} onValueChange={setPeriod}>
    <SelectTrigger className="w-[150px]">
      <SelectValue placeholder="Período" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="2026">2026</SelectItem>
      <SelectItem value="2025">2025</SelectItem>
      <SelectItem value="2024">2024</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### 2. Gráfico mejorado

```tsx
// Gráfico con tooltips y leyenda
<ResponsiveContainer width="100%" height={400}>
  <BarChart data={chartData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="indicator" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Bar dataKey="cuba" name="Cuba" fill="hsl(210, 100%, 50%)" />
    <Bar dataKey="chile" name="Chile" fill="hsl(0, 100%, 50%)" />
    <Bar dataKey="mexico" name="México" fill="hsl(150, 100%, 50%)" />
    <Bar dataKey="brasil" name="Brasil" fill="hsl(60, 100%, 50%)" />
  </BarChart>
</ResponsiveContainer>
```

### 3. Tabla de datos

```tsx
// Tabla debajo del gráfico
<Card className="p-6">
  <h3 className="mb-4 text-lg font-semibold">Datos Detallados</h3>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Indicador</TableHead>
        <TableHead>Cuba</TableHead>
        <TableHead>Chile</TableHead>
        <TableHead>México</TableHead>
        <TableHead>Brasil</TableHead>
        <TableHead>Fuente</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {data.map((row) => (
        <TableRow key={row.indicator}>
          <TableCell>{row.indicator}</TableCell>
          <TableCell>{row.cuba}</TableCell>
          <TableCell>{row.chile}</TableCell>
          <TableCell>{row.mexico}</TableCell>
          <TableCell>{row.brasil}</TableCell>
          <TableCell className="text-muted-foreground">{row.source}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</Card>
```

## Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| `frontend/src/pages/Competitiveness.tsx` | Reescritura completa |
| `frontend/src/hooks/useCompetitiveness.ts` | Agregar filtros al query |

## Criterios de Aceptación

- [ ] Filtro por sector funciona
- [ ] Filtro por período funciona
- [ ] Gráfico muestra datos filtrados
- [ ] Tabla de datos debajo del gráfico
- [ ] Tooltips en el gráfico
- [ ] Loading state con skeleton
- [ ] Empty state cuando no hay datos
- [ ] Responsive (desktop y mobile)
- [ ] `npm run lint` pasa

## Notas para el Agente

- Usar Recharts (ya instalado) para el gráfico
- Seguir patrón de `Indicators.tsx` para filtros
- La API ya soporta filtros por sector y período
- No inventar datos — usar los que retorna la API
