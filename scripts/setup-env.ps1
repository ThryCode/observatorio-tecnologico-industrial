<#
.SYNOPSIS
    Configura el entorno de desarrollo del Observatorio Tecnológico Industrial en Windows.

.DESCRIPTION
    Verifica que los servicios necesarios (PostgreSQL, Neo4j, Redis) estén corriendo,
    copia .env.windows como backend\.env, crea el virtualenv si no existe,
    instala dependencias y ejecuta las migraciones de Alembic.

.PARAMETER SkipMigrations
    Omite la ejecución de migraciones.

.PARAMETER SkipDeps
    Omite la instalación de dependencias Python.

.EXAMPLE
    .\scripts\setup-env.ps1
    Verifica servicios, instala deps y ejecuta migraciones.

.EXAMPLE
    .\scripts\setup-env.ps1 -SkipMigrations
    Solo verifica servicios y dependencias.
#>

param(
    [switch]$SkipMigrations,
    [switch]$SkipDeps
)

$Colors = @{
    Info    = "Cyan"
    Success = "Green"
    Warn    = "Yellow"
    Error   = "Red"
    Step    = "Magenta"
}

function Write-Log {
    param([string]$Message, [string]$Color = "Info")
    Write-Host "[$(Get-Date -Format HH:mm:ss)] $Message" -ForegroundColor $Colors[$Color]
}

function Test-ServicePort {
    param([int]$Port, [string]$Name)
    $connection = netstat -an 2>$null | findstr ":$Port "
    if ($connection -match "LISTENING") {
        Write-Log "  ✓ $Name está corriendo (puerto $Port)" -Color Success
        return $true
    }
    Write-Log "  ✗ $Name NO está corriendo en puerto $Port" -Color Error
    return $false
}

# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────
Write-Log "╔═══════════════════════════════════════════════╗" -Color Step
Write-Log "║  Observatorio — Configuración de Entorno       ║" -Color Step
Write-Log "╚═══════════════════════════════════════════════╝" -Color Step

$rootDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$backendDir = Join-Path $rootDir "backend"

# ── 1. Verificar servicios ──────────────────────────────────────────────────
Write-Log "`n▶ Verificando servicios..." -Color Step
$pgOk = Test-ServicePort -Port 5432 -Name "PostgreSQL"
$neo4jOk = Test-ServicePort -Port 7687 -Name "Neo4j (Bolt)"
$redisOk = Test-ServicePort -Port 6379 -Name "Redis"

if (-not ($pgOk -and $neo4jOk -and $redisOk)) {
    Write-Log "  ⚠ Algunos servicios no están corriendo." -Color Warn
    Write-Log "  Asegúrate de iniciarlos antes de continuar." -Color Warn
    Write-Log "  Revisa docs/instalacion-windows.md para instrucciones." -Color Warn
    $continue = Read-Host "  ¿Continuar de todas formas? (s/N)"
    if ($continue -ne "s") {
        exit 1
    }
}

# ── 2. Copiar .env.windows → backend\.env ────────────────────────────────────
Write-Log "`n▶ Configurando variables de entorno..." -Color Step
$envWin = Join-Path $rootDir ".env.windows"
$envBackend = Join-Path $backendDir ".env"

if (Test-Path $envWin) {
    Copy-Item -Path $envWin -Destination $envBackend -Force
    Write-Log "  ✓ .env.windows copiado a backend\.env" -Color Success
} else {
    Write-Log "  ✗ .env.windows no encontrado en la raíz del proyecto" -Color Error
    exit 1
}

# ── 3. Crear virtualenv si no existe ─────────────────────────────────────────
Write-Log "`n▶ Verificando entorno virtual Python..." -Color Step
$venvPath = Join-Path $backendDir "venv"
$venvActivate = Join-Path $venvPath "Scripts\Activate.ps1"

if (-not (Test-Path $venvActivate)) {
    Write-Log "  Creando virtualenv en backend\venv..." -Color Info
    Push-Location $backendDir
    python -m venv venv
    Pop-Location
    if (Test-Path $venvActivate) {
        Write-Log "  ✓ Virtualenv creado" -Color Success
    } else {
        Write-Log "  ✗ Error al crear virtualenv" -Color Error
        exit 1
    }
} else {
    Write-Log "  ✓ Virtualenv ya existe" -Color Success
}

# ── 4. Instalar dependencias ─────────────────────────────────────────────────
if (-not $SkipDeps) {
    Write-Log "`n▶ Instalando dependencias Python..." -Color Step
    Push-Location $backendDir
    try {
        & $venvActivate
        pip install -r requirements.txt 2>&1 | ForEach-Object {
            if ($_ -match "^ERROR|^error|failed") {
                Write-Log "    $_" -Color Error
            }
        }
        Write-Log "  ✓ Dependencias instaladas" -Color Success
    } catch {
        Write-Log "  ✗ Error instalando dependencias: $_" -Color Error
    }
    Pop-Location
}

# ── 5. Ejecutar migraciones ──────────────────────────────────────────────────
if (-not $SkipMigrations) {
    Write-Log "`n▶ Ejecutando migraciones de base de datos..." -Color Step
    Push-Location $backendDir
    try {
        & $venvActivate
        $output = alembic upgrade head 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Log "  ✓ Migraciones ejecutadas correctamente" -Color Success
        } else {
            Write-Log "  ✗ Error en migraciones:" -Color Error
            $output | ForEach-Object { Write-Log "    $_" -Color Error }
        }
    } catch {
        Write-Log "  ✗ Error: $_" -Color Error
    }
    Pop-Location
}

# ── 6. Resumen final ─────────────────────────────────────────────────────────
Write-Log "`n══════════════════════════════════════════════" -Color Success
Write-Log "  Configuración completada" -Color Success
Write-Log "══════════════════════════════════════════════" -Color Success
Write-Log "  Para iniciar el backend:" -Color Info
Write-Log "    cd backend" -Color Info
Write-Log "    ..\venv\Scripts\activate" -Color Info
Write-Log "    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" -Color Info
Write-Log "══════════════════════════════════════════════" -Color Success
