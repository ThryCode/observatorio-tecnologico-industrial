## Descripcion

Hay una cantidad significativa de codigo boilerplate duplicado tanto en backend como en frontend. Cada entidad (patents, technologies, regulations, organizations, indicators, professionals, alerts, bulletins, etc.) tiene su propio archivo de service, schema y pagina frontend con la misma estructura basica de CRUD.

## Backend: Services duplicados (~20 lineas identicas cada uno)

Cada service en `app/services/` sigue el mismo patron:

```python
async def get_by_id(db: AsyncSession, id: UUID) -> Model | None:
    result = await db.execute(select(Model).where(Model.id == id))
    return result.scalar_one_or_none()

async def create(db: AsyncSession, data: Schema) -> Model:
    obj = Model(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj
```

Esto se repite en 13 services con cambios minimos (solo el nombre de la clase).

### Propuesta

Crear un `BaseService` generico:

```python
class BaseService[ModelT, CreateSchemaT]:
    def __init__(self, model: type[ModelT]):
        self.model = model

    async def get_by_id(self, db: AsyncSession, id: UUID) -> ModelT | None: ...
    async def create(self, db: AsyncSession, data: CreateSchemaT) -> ModelT: ...
    async def update(self, db: AsyncSession, id: UUID, data: UpdateSchemaT) -> ModelT | None: ...
    async def delete(self, db: AsyncSession, id: UUID) -> bool: ...
    async def list(self, db: AsyncSession, ...) -> tuple[list[ModelT], int]: ...
```

Y que cada service concreto herede:

```python
class PatentService(BaseService[Patent, PatentCreate]):
    def __init__(self):
        super().__init__(Patent)

    # Solo metodos personalizados aqui
```

## Frontend: Paginas CRUD duplicadas (~400 lineas cada una)

`Technologies.tsx`, `Organizations.tsx`, `Indicators.tsx`, `Regulations.tsx`, `PublicationsPage.tsx` tienen la misma estructura: tabla con datos, modal de crear/editar, busqueda, paginacion.

### Propuesta

Crear un componente generico `CrudPage<T>` que acepte:

```tsx
interface CrudPageProps<T> {
  title: string;
  columns: ColumnDef<T>[];
  queryFn: () => Promise<PaginatedResponse<T>>;
  createFn: (data: CreatePayload) => Promise<T>;
  updateFn: (id: string, data: UpdatePayload) => Promise<T>;
  deleteFn: (id: string) => Promise<void>;
  searchFields: (keyof T)[];
  formComponent: React.ComponentType<FormProps<T>>;
}
```

Y cada pagina se reduce a:

```tsx
const columns = [...];
const form = <TechnologyForm />;
export default () => <CrudPage title="Tecnologias" columns={columns} queryFn={getTechnologies} ... />;
```

## Criterios de aceptacion

- [ ] Backend: `BaseService` implementado y todos los services refactorizados
- [ ] Frontend: `CrudPage` implementado y al menos 3 paginas refactorizadas
- [ ] Funcionalidad existente no se rompe (todos los tests pasan)
- [ ] `ruff check backend/` pasa
- [ ] `npm run lint` / `tsc --noEmit` pasan
