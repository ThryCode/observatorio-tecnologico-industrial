# F1-08: Refactor Network y Profile con hooks dedicados

**Etiquetas:** `fase-1`, `frontend`, `refactor`
**Hito:** Fase 1 — Calidad
**Depende de:** F1-07 (Separar professionals API/hooks)
**Subagente:** `frontend-coder`
**Skill:** `react-patterns`

---

## Descripción

Después de separar la API de professionals (issue F1-07), las páginas `Network.tsx` y `Profile.tsx` siguen usando patrones subóptimos:

- **Network.tsx**: Usa `useQuery` inline en vez del hook dedicado `useProfessionalList`. Además usa `<table>` HTML en vez del componente shadcn `<Table>`.
- **Profile.tsx**: Usa `useEffect` + `useState` para cargar datos, en vez de `useMyProfessionalProfile()` de TanStack Query.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/pages/Network.tsx` | Refactor a hook dedicado + migrar a shadcn Table |
| `src/pages/Profile.tsx` | Refactor a hook dedicado |

## Especificación técnica

### Network.tsx — Cambios

**1. Reemplazar imports:**
```diff
- import { listProfessionals, listSpecialties } from '@/api/auth';
+ import { useProfessionalList, useSpecialties } from '@/hooks/useProfessionals';
```

**2. Reemplazar lógica de datos:**
```diff
- const [professionals, setProfessionals] = useState([]);
- const [specialties, setSpecialties] = useState([]);
- const [loading, setLoading] = useState(true);
- useEffect(() => {
-   async function load() {
-     const [p, s] = await Promise.all([
-       listProfessionals(page, 20, specialty),
-       listSpecialties(),
-     ]);
-     setProfessionals(p.items);
-     setSpecialties(s.items || []);
-     setLoading(false);
-   }
-   load();
- }, [page, specialty]);
+ const { data: profData, isLoading: loading } = useProfessionalList(page, 20, specialty || undefined);
+ const { data: specsData } = useSpecialties();
+ const specialties = specsData?.items ?? [];
+ const professionals = profData?.items ?? [];
```

**3. Migrar tabla HTML a shadcn `<Table>`:**
```diff
- <table className="w-full">
-   <thead>
-     <tr><th>Nombre</th><th>Especialidad</th><th>Contacto</th></tr>
-   </thead>
-   <tbody>
-     {professionals.map(p => (
-       <tr key={p.id}><td>{p.user?.full_name ?? '—'}</td><td>{p.especialidad}</td><td>{p.user?.email ?? '—'}</td></tr>
-     ))}
-   </tbody>
- </table>
+ import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
+ <Table>
+   <TableHeader>
+     <TableRow>
+       <TableHead>Nombre</TableHead>
+       <TableHead>Especialidad</TableHead>
+       <TableHead>Contacto</TableHead>
+     </TableRow>
+   </TableHeader>
+   <TableBody>
+     {professionals.map(p => (
+       <TableRow key={p.id}>
+         <TableCell>{p.user?.full_name ?? '—'}</TableCell>
+         <TableCell>{p.especialidad}</TableCell>
+         <TableCell>{p.user?.email ?? '—'}</TableCell>
+       </TableRow>
+     ))}
+   </TableBody>
+ </Table>
```

**4. Loading state:**
```diff
- if (loading) return <div>Cargando...</div>;
+ import { Skeleton } from '@/components/ui/skeleton';
+ if (loading) return <Skeleton className="h-96 w-full" />;
```

### Profile.tsx — Cambios

**1. Reemplazar imports:**
```diff
- import { getMyProfessionalProfile, updateMyProfessionalProfile } from '@/api/auth';
+ import { useMyProfessionalProfile, useUpdateMyProfessionalProfile } from '@/hooks/useProfessionals';
```

**2. Reemplazar useEffect + useState:**
```diff
- const [profProfile, setProfProfile] = useState(null);
- useEffect(() => {
-   getMyProfessionalProfile()
-     .then(setProfProfile)
-     .catch(() => setProfProfile(null));
- }, []);
+ const { data: profProfile } = useMyProfessionalProfile();
```

**3. Reemplazar submit handler:**
```diff
- const handleSubmit = async (data) => {
-   const updated = await updateMyProfessionalProfile(data);
-   setProfProfile(updated);
- };
+ const updateProfile = useUpdateMyProfessionalProfile();
+ const handleSubmit = (data: Partial<ProfessionalProfile>) => {
+   updateProfile.mutate(data);
+ };
```

## Criterios de aceptación

- [ ] `Network.tsx` usa `useProfessionalList` y `useSpecialties` hooks
- [ ] `Network.tsx` usa shadcn `<Table>` components en vez de HTML `<table>`
- [ ] `Network.tsx` usa `<Skeleton>` para loading state
- [ ] `Profile.tsx` usa `useMyProfessionalProfile` y `useUpdateMyProfessionalProfile`
- [ ] Profile.tsx ya no tiene `useEffect` para carga de datos
- [ ] `npm run lint` pasa
- [ ] `npm run build` pasa

## Riesgos

- **Medio**: Si `Network.tsx` tiene filtros o búsqueda local además del filtro por especialidad, asegurar que no se pierde al refactorizar. Revisar el componente antes de refactorizar.
- **Bajo**: Profile.tsx podría tener lógica de formulario compleja. Los hooks mantienen la misma interfaz de datos, solo cambia el origen.
