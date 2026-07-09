# Instalación Nativa del Observatorio Tecnológico Industrial en Windows 10

Guía paso a paso para instalar y ejecutar el backend y frontend del Observatorio
Tecnológico Industrial directamente en Windows 10, sin Docker ni máquinas virtuales.

---

## Requisitos del sistema

| Componente | Especificación |
|---|---|
| Sistema operativo | Windows 10 Pro (build 18362 o superior) |
| RAM | 8 GB mínimo |
| Disco | 10 GB espacio libre |

---

## 1. Prerrequisitos

### 1.1 Python 3.11

1. Descargar **Python 3.11.9** desde:
   https://www.python.org/downloads/release/python-3119/
   — Elegir `Windows installer (64-bit)`.

2. **Importante:** Marcar **"Add Python to PATH"** y hacer clic en **"Install Now"**.

3. Verificar:
   ```powershell
   python --version   # Python 3.11.9
   pip --version
   ```

### 1.2 Node.js 20 + npm

1. Descargar **Node.js 20 LTS** desde: https://nodejs.org/en/download/
2. Ejecutar el instalador con opciones por defecto.
3. Verificar:
   ```powershell
   node --version   # v20.x.x
   npm --version    # 10.x.x
   ```

### 1.3 Git

1. Descargar desde: https://git-scm.com/download/win
2. Ejecutar el instalador con opciones por defecto.
3. Verificar:
   ```powershell
   git --version
   ```

---

## 2. Java JDK 17 (requisito de Neo4j)

Neo4j 5 Community requiere Java 17.

1. Descargar **Eclipse Temurin JDK 17 LTS** desde:
   https://adoptium.net/temurin/releases/?version=17
   — Elegir Windows x64 MSI installer.

2. Configurar variable `JAVA_HOME`:
   ```powershell
   [System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17.0.12.7-hotspot", "Machine")
   ```
   Ajusta la ruta según la versión exacta instalada.

3. Cerrar y reabrir la terminal. Verificar:
   ```powershell
   java -version
   ```
   Debe mostrar `openjdk version "17.0.x"`.

---

## 3. PostgreSQL 15

1. Descargar el instalador EDB desde:
   https://www.postgresql.org/download/windows/
   — Elegir **PostgreSQL 15.x** (Windows x86-64).

2. Durante la instalación:
   - Puerto: **5432** (por defecto)
   - Password del superusuario `postgres`: **observatorio_dev**
   - **pgAdmin 4** incluido

3. Crear base de datos y usuario:
   ```sql
   CREATE USER observatorio WITH PASSWORD 'observatorio_dev';
   CREATE DATABASE observatorio_db OWNER observatorio;
   GRANT ALL PRIVILEGES ON DATABASE observatorio_db TO observatorio;
   ```

4. Verificar:
   ```powershell
   psql -U observatorio -d observatorio_db -h localhost -p 5432 -c "\conninfo"
   ```
   (Contraseña: `observatorio_dev`)

5. El servicio `postgresql-x64-15` se instala automáticamente.

---

## 4. Neo4j 5 Community

1. Descargar **Neo4j 5 Community Edition** (ZIP) desde:
   https://neo4j.com/download-center/#community
   (Requiere registro gratuito.)

2. Extraer el ZIP en `C:\neo4j\`. La estructura debe quedar:
   ```
   C:\neo4j\
   ├── bin\
   ├── conf\
   ├── data\
   ├── logs\
   ├── plugins\
   └── ...
   ```

3. Configurar `C:\neo4j\conf\neo4j.conf`:
   ```
   server.bolt.listen_address=0.0.0.0:7687
   server.http.listen_address=0.0.0.0:7474
   server.bolt.tls_level=DISABLED
   dbms.security.auth_enabled=true
   dbms.memory.pagecache.size=512m
   dbms.memory.heap.initial_size=512m
   dbms.memory.heap.max_size=1g
   ```

4. Iniciar Neo4j:
   ```powershell
   cd C:\neo4j\bin
   .\neo4j.bat console
   ```

5. Abrir navegador en http://localhost:7474 y cambiar la contraseña a
   **observatorio_dev** (credencial inicial: `neo4j` / `neo4j`).

6. Verificar:
   ```powershell
   cd C:\neo4j\bin
   .\cypher-shell -u neo4j -p observatorio_dev "RETURN 1;"
   ```

---

## 5. Redis 5 (tporadowski)

No existe Redis 7 nativo para Windows. Usamos el port mantenido por
tporadowski (Redis 5.0.14, compatible con la API necesaria).

1. Descargar desde GitHub Releases:
   https://github.com/tporadowski/redis/releases
   — Elegir `Redis-x64-5.0.14.1.zip`.

2. Extraer en `C:\redis\`. Debe quedar:
   ```
   C:\redis\
   ├── redis-server.exe
   ├── redis-cli.exe
   ├── redis.windows.conf
   └── ...
   ```

3. Iniciar Redis:
   ```powershell
   cd C:\redis
   .\redis-server.exe
   ```

4. Verificar (en otra terminal):
   ```powershell
   redis-cli ping
   ```
   Debe responder `PONG`.

---

## 6. Clonar el repositorio

```powershell
git clone https://github.com/ThryCode/observatorio-tecnologico-industrial.git
cd observatorio-tecnologico-industrial
```

---

## 7. Configurar el backend

### 7.1 Variables de entorno

```powershell
copy .env.windows backend\.env
```

### 7.2 Entorno virtual y dependencias

```powershell
python -m venv backend\venv
backend\venv\Scripts\activate
pip install -r backend\requirements.txt
```

### 7.3 Migraciones

Asegúrate de que PostgreSQL esté corriendo, luego:

```powershell
cd backend
..\venv\Scripts\activate
alembic upgrade head
```

### 7.4 Iniciar backend

```powershell
cd backend
..\venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 8. Configurar el frontend

```powershell
cd frontend
npm install
npm run dev
```

---

## 9. Verificar la instalación

| URL | Descripción |
|---|---|
| http://localhost:8000/docs | Documentación Swagger de la API |
| http://localhost:8000/redoc | Documentación ReDoc de la API |
| http://localhost:5173 | Frontend (Vite dev server) |
| http://localhost:7474 | Neo4j Browser |
| http://localhost:8080 | pgAdmin 4 (gestor PostgreSQL) |

Probar el login del superusuario:
```powershell
curl -X POST http://localhost:8000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"username":"admin@mindus.gob.cu","password":"admin123"}'
```
Debe devolver un JSON con `access_token`.

---

## Referencia rápida

| Acción | Comando |
|---|---|
| Iniciar PostgreSQL | `Start-Service postgresql-x64-15` |
| Iniciar Neo4j | `C:\neo4j\bin\neo4j.bat console` |
| Iniciar Redis | `C:\redis\redis-server.exe` |
| Activar virtualenv | `backend\venv\Scripts\activate` |
| Iniciar backend | `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000` |
| Iniciar frontend | `npm run dev` (en `frontend/`) |
| Migraciones | `alembic upgrade head` (en `backend/`) |
