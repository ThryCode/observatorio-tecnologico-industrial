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

### AuditLog (Registro de Auditoria)

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | UUID | Identificador unico |
| user_id | UUID | Usuario que realizo la accion (FK -> users.id) |
| action | string(20) | Accion realizada (CREATE, UPDATE, DELETE) |
| entity_type | string(50) | Tipo de entidad afectada |
| entity_id | string(36) | UUID de la entidad afectada |
| changes | json | Payload o diff de los cambios realizados |
| ip_address | string(45) | Direccion IPv4 o IPv6 del solicitante |
| created_at | datetime | Fecha y hora del evento |

### CompetitivenessIndex (Indice de Competitividad)

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | UUID | Identificador unico |
| sector | string(200) | Nombre del sector |
| sector_codigo | string | Codigo del sector industrial (FK -> industrial_sectores.codigo) |
| indicador | string(200) | Nombre del indicador |
| valor | numeric(10,2) | Valor numerico del indice |
| pais | string(100) | Pais |
| periodo | string(20) | Periodo temporal |
| fuente | string(300) | Fuente de datos |
| created_at | datetime | Fecha de creacion |
| updated_at | datetime | Fecha de actualizacion |

### Follow (Seguimiento)

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | UUID | Identificador unico |
| follower_id | UUID | ID del seguidor (puede ser User u Organization) |
| follower_type | string(20) | Discriminador: "user" o "organization" |
| organization_id | UUID | Organizacion seguida (FK -> organizations.id, CASCADE) |
| created_at | datetime | Fecha de creacion |

**Constraint unico:** (follower_id, follower_type, organization_id)

### PatentMapEntry (Celda de Mapa de Patentes)

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | UUID | Identificador unico |
| tecnologia | string(200) | Area tecnologica |
| pais | string(100) | Pais |
| sector_codigo | string | Codigo del sector industrial (FK -> industrial_sectores.codigo) |
| total_patentes | integer | Total de patentes en la celda |
| periodo | string(20) | Periodo temporal |
| tendencia | string(20) | Direccion de tendencia: creciente, estable, decreciente |
| created_at | datetime | Fecha de creacion |
| updated_at | datetime | Fecha de actualizacion |

### ProfessionalProfile (Perfil Profesional)

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | UUID | Identificador unico |
| user_id | UUID | Usuario propietario (FK -> users.id, CASCADE, UNIQUE) |
| especialidad | string(100) | Area de especialidad |
| grado_cientifico | string(50) | Grado cientifico (Dr, MSc, etc.) |
| cv_url | string(255) | URL del curriculum vitae |
| biografia | text | Biografia (longitud ilimitada) |
| intereses | json | Lista de temas de interes (array de strings) |
| linkedin_url | string(255) | URL de LinkedIn |
| twitter_url | string(255) | URL de Twitter |
| researchgate_url | string(255) | URL de ResearchGate |
| orcid | string(50) | Identificador ORCID |
| created_at | datetime | Fecha de creacion |
| updated_at | datetime | Fecha de actualizacion |

### ResearchPublication (Publicacion de Investigacion)

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | UUID | Identificador unico |
| titulo | string(300) | Titulo de la publicacion |
| autores | text | Autores (texto plano) |
| resumen | text | Resumen o abstract |
| doi | string(100) | Identificador DOI |
| journal | string(200) | Nombre de la revista |
| fecha_publicacion | datetime | Fecha de publicacion |
| palabras_clave | json | Palabras clave (array de strings) |
| sector_codigo | string | Codigo del sector industrial (FK -> industrial_sectores.codigo) |
| url | string(500) | URL de la publicacion |
| created_by | UUID | Usuario creador (FK -> users.id) |
| created_at | datetime | Fecha de creacion |
| updated_at | datetime | Fecha de actualizacion |

## Roles del Sistema

| Rol | Descripcion | Permisos |
|-----|-------------|----------|
| `admin_mindus` | Administrador MINDUS | Acceso total |
| `rep_cti` | Representante CTI | Ver su empresa, contenido |
| `analista` | Analista | Crear/editar patentes, indicadores |
| `profesional` | Profesional | Crear publicaciones, seguir |
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
| `WORKS_AT` | Person/User | Organization | Trabaja en |
| `IS_AUTHOR_OF` | Person/User | Patent/Regulation | Autor de patente o normativa |

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
| WS | `/api/v1/ws/alerts` | WebSocket alertas real-time |

### Profesionales

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/v1/professionals` | Listar profesionales |
| GET | `/api/v1/professionals/specialties` | Listar especialidades |
| GET | `/api/v1/professionals/me` | Perfil propio |
| PUT | `/api/v1/professionals/me` | Actualizar perfil propio |

### Seguimiento (Follows)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/v1/follows/organizations/{id}` | Seguir organizacion |
| DELETE | `/api/v1/follows/organizations/{id}` | Dejar de seguir |
| GET | `/api/v1/follows/status/{org_id}` | Estado de seguimiento |

### Mapas de Patentes

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/v1/patent-maps` | Mapas de patentes |

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
