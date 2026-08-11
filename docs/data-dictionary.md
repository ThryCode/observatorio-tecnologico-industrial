# Diccionario de Datos - Observatorio Tecnologico Industrial

## Entidades Principales

### Technology (Tecnologia)

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | UUID | Identificador unico |
| nombre | string | Nombre de la tecnologia |
| descripcion | string | Descripcion detallada |
| trl_nivel | int | Technology Readiness Level (1-9) |
| sector_codigo | string | Codigo del sector industrial (FK) |
| palabras_clave | string[] | Palabras clave para busqueda |
| created_at | datetime | Fecha de creacion |
| updated_at | datetime | Fecha de actualizacion |

**TRL (Technology Readiness Level):**
- 1-3: Basicos (investigacion)
- 4-6: Intermedios (desarrollo)
- 7-9: Avanzados (produccion)

### Organization (Organizacion)

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | UUID | Identificador unico |
| nombre | string | Nombre de la organizacion |
| siglas | string | Siglas (unico) |
| tipo | string | Tipo: ministerio, empresa, centro_investigacion |
| sector_codigo | string | Codigo del sector industrial (FK) |
| pais | string | Pais (default: Cuba) |
| provincia | string | Provincia |
| sitio_web | string | URL del sitio web |
| email_contacto | string | Email de contacto |
| created_at | datetime | Fecha de creacion |
| updated_at | datetime | Fecha de actualizacion |

### Patent (Patente)

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | UUID | Identificador unico |
| title | string | Titulo de la patente |
| patent_number | string | Numero de patente (formato: CU2024/0001) |
| applicant | string | Solicitante |
| inventor | string | Inventor(es) |
| filing_date | date | Fecha de presentacion |
| publication_date | date | Fecha de publicacion |
| status | string | Estado: filed, examination, granted, expired, rejected |
| abstract | string | Resumen |
| technological_sector | string | Sector tecnologico |
| country | string | Pais de origen |
| organization_id | UUID | Organizacion propietaria (FK) |
| created_at | datetime | Fecha de creacion |
| updated_at | datetime | Fecha de actualizacion |

**Patent Status:**
- `filed`: Solicitada
- `examination`: En examen
- `granted`: Otorgada
- `expired`: Expirada
- `rejected`: Rechazada

### Regulation (Normativa)

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | UUID | Identificador unico |
| title | string | Titulo de la normativa |
| regulation_number | string | Numero de normativa |
| issuing_body | string | Organismo emisor |
| publication_date | date | Fecha de publicacion |
| effective_date | date | Fecha de entrada en vigor |
| category | string | Categoria: law, decree, resolution, standard, norm |
| summary | string | Resumen |
| sector_codigo | string | Codigo del sector industrial (FK) |
| created_at | datetime | Fecha de creacion |
| updated_at | datetime | Fecha de actualizacion |

**Regulation Categories:**
- `law`: Ley
- `decree`: Decreto
- `resolution`: Resolucion
- `standard`: Norma tecnica
- `norm`: Norma

### Indicator (Indicador)

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | UUID | Identificador unico |
| name | string | Nombre del indicador |
| code | string | Codigo unico (ej: IPI-2025) |
| description | string | Descripcion |
| unit | string | Unidad de medida |
| value | float | Valor actual |
| source | string | Fuente de datos |
| period | string | Periodo: monthly, quarterly, yearly |
| sector_codigo | string | Codigo del sector industrial (FK) |
| date | date | Fecha del dato |
| created_at | datetime | Fecha de creacion |
| updated_at | datetime | Fecha de actualizacion |

### IndustrialSector (Sector Industrial)

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| codigo | string | Codigo unico (2-3 letras) |
| nombre | string | Nombre del sector |
| descripcion | string | Descripcion |
| created_at | datetime | Fecha de creacion |
| updated_at | datetime | Fecha de actualizacion |

**Sectores disponibles:**
- `BIO`: Biotecnologia
- `ELE`: Electronica
- `ENE`: Energia
- `MET`: Metalurgia
- `QUI`: Quimica
- `SID`: Siderurgia
- `AUT`: Automatizacion
- `TIC`: Tecnologias de la Informacion

### Alert (Alerta)

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | UUID | Identificador unico |
| titulo | string | Titulo de la alerta |
| descripcion | string | Descripcion detallada |
| severidad | string | Severidad: alta, media, baja |
| fecha | date | Fecha de la alerta |
| sector | string | Sector afectado |
| leida | boolean | Si fue leida por el usuario |
| created_at | datetime | Fecha de creacion |

### Bulletin (Boletin)

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | UUID | Identificador unico |
| titulo | string | Titulo del boletin |
| resumen | string | Resumen |
| fecha_publicacion | date | Fecha de publicacion |
| categoria | string | Categoria: boletin, estudio, alerta, mapa |
| autor | string | Autor |
| archivo_url | string | URL del archivo adjunto |
| sector_codigo | string | Codigo del sector industrial (FK) |

### User (Usuario)

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | UUID | Identificador unico |
| username | string | Nombre de usuario (unico) |
| email | string | Email (unico) |
| full_name | string | Nombre completo |
| role | string | Rol del usuario |
| is_active | boolean | Si la cuenta esta activa |
| is_superuser | boolean | Si es superusuario |
| account_type | string | Tipo de cuenta |
| status | string | Estado: pending, approved, rejected |
| rejection_reason | string | Razon de rechazo |
| organization_id | UUID | Organizacion (FK) |

## Roles del Sistema

| Rol | Descripcion | Permisos |
|-----|-------------|----------|
| `admin_mindus` | Administrador MINDUS | Acceso total |
| `rep_cti` | Representante CTI | Ver su empresa, contenido |
| `analista` | Analista | Crear/editar patentes, indicadores |
| `profesional` | Profesional | Crear publicaciones, seguir |
| `cliente` | Cliente | Solo lectura |
| `visitante` | Visitante | Solo lectura basica |

## Relaciones en Neo4j

### Nodos

- `Technology`: Tecnologia
- `Organization`: Organizacion
- `Patent`: Patente
- `Regulation`: Normativa
- `Indicator`: Indicador
- `IndustrialSector`: Sector Industrial
- `Enterprise`: Organizacion empresarial (para follow)

### Relaciones

| Relacion | Desde | Hasta | Descripcion |
|----------|-------|-------|-------------|
| `RELATES_TO` | Technology | Technology | Relacion entre tecnologias |
| `OPERATES_IN` | Organization | Technology | Tecnologia que usa la organizacion |
| `HAS_PATENT` | Organization | Patent | Patente de la organizacion |
| `REGULATES` | Regulation | Technology | Normativa que regula |
| `MEASURES` | Indicator | Technology | Indicador que mide |
| `BELONGS_TO_SECTOR` | Organization | IndustrialSector | Sector de la organizacion |
| `FOLLOWS` | Organization | Organization | Seguimiento entre organizaciones |
| `WORKS_AT` | User | Organization | Trabaja en |
| `IS_AUTHOR_OF` | User | Regulation | Autor de normativa |

## Endpoints API

### Autenticacion

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/v1/auth/login` | Iniciar sesion |
| POST | `/api/v1/auth/register/public` | Registro publico |
| GET | `/api/v1/auth/me` | Datos del usuario actual |
| GET | `/api/v1/auth/pending` | Usuarios pendientes |
| POST | `/api/v1/auth/{id}/approve` | Aprobar usuario |
| POST | `/api/v1/auth/{id}/reject` | Rechazar usuario |

### CRUD Operations

| Entidad | Metodo | Ruta | Descripcion |
|---------|--------|------|-------------|
| Technologies | GET/POST | `/api/v1/technologies` | Listar/crear |
| Technologies | GET/PUT/DELETE | `/api/v1/technologies/{id}` | Obtener/actualizar/eliminar |
| Patents | GET/POST | `/api/v1/patents` | Listar/crear |
| Patents | GET/PUT/DELETE | `/api/v1/patents/{id}` | Obtener/actualizar/eliminar |
| Organizations | GET/POST | `/api/v1/organizations` | Listar/crear |
| Organizations | GET/PUT/DELETE | `/api/v1/organizations/{id}` | Obtener/actualizar/eliminar |
| Indicators | GET/POST | `/api/v1/indicators` | Listar/crear |
| Indicators | GET/PUT/DELETE | `/api/v1/indicators/{id}` | Obtener/actualizar/eliminar |
| Regulations | GET/POST | `/api/v1/regulations` | Listar/crear |
| Regulations | GET/PUT/DELETE | `/api/v1/regulations/{id}` | Obtener/actualizar/eliminar |

### Grafo

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/v1/graph/sync` | Sincronizar grafo |
| GET | `/api/v1/graph/stats` | Estadisticas |
| GET | `/api/v1/graph/search` | Buscar nodos |
| GET | `/api/v1/graph/explore` | Explorar nodo |
| GET | `/api/v1/graph/enterprise` | Grafo empresarial |
| GET | `/api/v1/graph/recommendations/{org_id}` | Recomendaciones |

### Dashboard

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/v1/dashboard/summary` | KPIs |
| GET | `/api/v1/dashboard/timeline` | Linea de tiempo |
| GET | `/api/v1/dashboard/sectors` | Sectores con conteo |

## Glosario

| Termino | Definicion |
|---------|------------|
| **TRL** | Technology Readiness Level - Nivel de madurez tecnologica (1-9) |
| **CTI** | Ciencia, Tecnologia e Innovacion |
| **MINDUS** | Ministerio de Industrias de Cuba |
| **SaaS** | Software as a Service |
| **RBAC** | Role-Based Access Control |
| **CRUD** | Create, Read, Update, Delete |
| **APOC** | Awesome Procedures On Cypher (Neo4j) |
| **GDS** | Graph Data Science (Neo4j) |
| **MERGE** | Cypher: crear o actualizar nodo/relacion |
| **UNWIND** | Cypher: expandir lista a filas |
| **ilike** | SQL: busqueda case-insensitive con patron |
| **aiosqlite** | Driver async de SQLite para Python |
| **TanStack Query** | Libreria para gestion de estado del servidor |
| **Vite** | Bundler frontend con HMR rapido |
| **Tailwind** | Framework CSS utility-first |
| **shadcn/ui** | Componentes UI copiados al proyecto |
| **Pydantic** | Libreria Python para validacion de datos |
| **Alembic** | Sistema de migraciones para SQLAlchemy |
| **loguru** | Libreria Python para logging |
| **slowapi** | Rate limiting para FastAPI |
