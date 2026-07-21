<#
.SYNOPSIS
    Configura el entorno de desarrollo del Observatorio Tecnológico Industrial en Windows.

.DESCRIPTION
    Verifica servicios (PostgreSQL, Neo4j, Redis), copia .env, crea virtualenv,
    instala dependencias, ejecuta migraciones Alembic y crea superusuario inicial.

.PARAMETER SkipMigrations
    Omite ejecucion de migraciones y creacion de superusuario.

.PARAMETER SkipDeps
    Omite instalacion de dependencias Python.

.PARAMETER SkipSeed
    Omite creacion de superusuario inicial.

.EXAMPLE
    .\scripts\setup-env.ps1
    Configuracion completa.

.EXAMPLE
    .\scripts\setup-env.ps1 -SkipMigrations -SkipDeps
    Solo verifica servicios y copia .env.
#>

param(
    [switch]$SkipMigrations,
    [switch]$SkipDeps,
    [switch]$SkipSeed
)

$C = @{ Info = "Cyan"; Success = "Green"; Warn = "Yellow"; Error = "Red"; Step = "Magenta" }

function Write-Log {
    param([string]$Message, [string]$Color = "Info")
    Write-Host "[$(Get-Date -Format HH:mm:ss)] $Message" -ForegroundColor $C[$Color]
}

$rootDir    = Resolve-Path (Join-Path $PSScriptRoot "..")
$backendDir = Join-Path $rootDir "backend"
$venvDir    = Join-Path $backendDir "venv"
$venvPy     = Join-Path $venvDir "Scripts/python.exe"
$venvAct    = Join-Path $venvDir "Scripts/Activate.ps1"

if (-not (Test-Path $backendDir)) {
    Write-Log "X No se encuentra backend/ en $backendDir" -Color Error
    exit 1
}

Write-Log "+----------------------------------------------+" -Color Step
Write-Log "|  Observatorio - Configuracion de Entorno     |" -Color Step
Write-Log "+----------------------------------------------+" -Color Step

# ─── FUNCIONES AUXILIARES ─────────────────────────────────────────────────────

function Test-ServicePort {
    param([int]$Port, [string]$Name)
    $found = @(netstat -an 2>$null | Select-String ":$Port\s" | Select-String "LISTENING")
    if ($found.Count -gt 0) {
        Write-Log "  v $Name esta corriendo (puerto $Port)" -Color Success
        return $true
    }
    Write-Log "  x $Name NO esta corriendo (puerto $Port)" -Color Error
    return $false
}

function Test-ServiceMultiPort {
    param([int[]]$Ports, [string]$Name)
    foreach ($p in $Ports) {
        $found = @(netstat -an 2>$null | Select-String ":$p\s" | Select-String "LISTENING")
        if ($found.Count -gt 0) {
            Write-Log "  v $Name esta corriendo (puerto $p)" -Color Success
            return $true
        }
    }
    $pl = ($Ports -join ", ")
    Write-Log "  x $Name NO esta corriendo (ninguno: $pl)" -Color Error
    return $false
}

# ─── PASO 1: VERIFICAR SERVICIOS ──────────────────────────────────────────────

Write-Log "`n> Verificando servicios..." -Color Step

$pgOk    = Test-ServicePort      -Port 5432 -Name "PostgreSQL"
$neo4jOk = Test-ServiceMultiPort -Ports @(7687, 7474) -Name "Neo4j"
$redisOk = Test-ServicePort      -Port 6379 -Name "Redis"

if (-not ($pgOk -and $neo4jOk -and $redisOk)) {
    Write-Log "  Los servicios marcados con x no estan corriendo." -Color Warn
    Write-Log "  Para iniciarlos:" -Color Warn
    Write-Host   "    PostgreSQL: net start postgresql-x64-15  (o via pg_ctl)" -ForegroundColor Yellow
    Write-Host   "    Neo4j:      C:\neo4j\bin\neo4j.bat console" -ForegroundColor Yellow
    Write-Host   "    Redis:      C:\redis\redis-server.exe" -ForegroundColor Yellow
    $cont = Read-Host "  Continuar de todas formas? (s/N)"
    if ($cont -ne "s") { Write-Log "  Abortando." -Color Error; exit 1 }
}

# ─── PASO 2: COPIAR .ENV ──────────────────────────────────────────────────────

Write-Log "`n> Configurando variables de entorno..." -Color Step
$envSrc = Join-Path $rootDir ".env.windows"
$envDst = Join-Path $backendDir ".env"

if (-not (Test-Path $envSrc)) {
    Write-Log "  X .env.windows no encontrado en la raiz" -Color Error
    exit 1
}
Copy-Item -Path $envSrc -Destination $envDst -Force
Write-Log "  v .env.windows copiado a backend\.env" -Color Success

# ─── PASO 3: VIRTUALENV ───────────────────────────────────────────────────────

Write-Log "`n> Entorno virtual Python..." -Color Step

if (-not (Test-Path $venvAct)) {
    Write-Log "  Creando virtualenv en backend\venv..." -Color Info
    Push-Location $backendDir
    $pyVer = python --version 2>&1
    Write-Log "  Python: $pyVer" -Color Info
    python -m venv venv
    $venvOk = ($LASTEXITCODE -eq 0) -and (Test-Path $venvAct)
    Pop-Location
    if (-not $venvOk) {
        Write-Log "  X Error creando virtualenv" -Color Error
        exit 1
    }
    Write-Log "  v Virtualenv creado" -Color Success
} else {
    Write-Log "  v Virtualenv ya existe" -Color Success
}

Write-Log "  Actualizando pip..." -Color Info
& $venvPy -m pip install --upgrade pip --quiet 2>$null
Write-Log "  v pip actualizado" -Color Success

# ─── PASO 4: INSTALAR DEPENDENCIAS ────────────────────────────────────────────

if (-not $SkipDeps) {
    Write-Log "`n> Instalando dependencias Python..." -Color Step
    $reqFile = Join-Path $backendDir "requirements.txt"
    if (-not (Test-Path $reqFile)) {
        Write-Log "  X requirements.txt no encontrado" -Color Error
        exit 1
    }

    $ok = $false
    for ($i = 1; $i -le 3; $i++) {
        if ($i -gt 1) { Write-Log "  Reintento $i/3..." -Color Warn; Start-Sleep -Seconds 3 }
        & $venvPy -m pip install -r $reqFile 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) { $ok = $true; break }
    }

    if (-not $ok) {
        Write-Log "  No se pudieron instalar dependencias." -Color Warn
        Write-Log "  Comando manual: .\venv\Scripts\pip install -r requirements.txt" -Color Warn
        $cont = Read-Host "  Continuar de todas formas? (s/N)"
        if ($cont -ne "s") { exit 1 }
    } else {
        Write-Log "  v Dependencias instaladas" -Color Success
    }
}

# ─── PASO 5: MIGRACIONES ALEMBIC ──────────────────────────────────────────────

if (-not $SkipMigrations) {
    Write-Log "`n> Ejecutando migraciones..." -Color Step

    $ok = $false
    for ($i = 1; $i -le 2; $i++) {
        if ($i -gt 1) { Write-Log "  Reintento $i/2..." -Color Warn; Start-Sleep -Seconds 2 }
        Push-Location $backendDir
        $output = & $venvPy -m alembic upgrade head 2>&1
        $ec = $LASTEXITCODE
        Pop-Location
        if ($ec -eq 0) { $ok = $true; break }

        $fatal = ($output -match "could not connect|connection refused|does not exist|role.*does not exist")
        if ($fatal) {
            Write-Log "  X Error de conexion a PostgreSQL:" -Color Error
            $output | Select-String -Pattern "error|Error" | ForEach-Object { Write-Log "    $_" -Color Error }
            Write-Log "  Verifica que PostgreSQL este corriendo y la DB exista" -Color Error
            break
        }
    }

    if (-not $ok) {
        Write-Log "  Migraciones fallaron." -Color Warn
        Write-Log "  Comando manual: cd backend && .\venv\Scripts\python -m alembic upgrade head" -Color Warn
    } else {
        Write-Log "  v Migraciones ejecutadas" -Color Success
    }
}

# ─── PASO 6: SUPERUSUARIO ─────────────────────────────────────────────────────

if ((-not $SkipMigrations) -and (-not $SkipSeed)) {
    Write-Log "`n> Verificando superusuario..." -Color Step

    $seedScript = Join-Path $backendDir "scripts/seed_superuser.py"
    if (Test-Path $seedScript) {
        Push-Location $backendDir
        $output = & $venvPy $seedScript 2>&1
        $ec = $LASTEXITCODE
        Pop-Location
        if ($ec -eq 0) {
            Write-Log "  v Superusuario verificado/creado" -Color Success
        } else {
            $errText = ($output -join " ")
            if ($errText -match "duplicate key|already exists|DuplicateKey") {
                Write-Log "  v Superusuario ya existe" -Color Success
            } else {
                Write-Log "  No se pudo crear superusuario." -Color Warn
                $output | Select-String -Pattern "Error|error|Traceback" | Select-Object -First 3 | ForEach-Object {
                    Write-Log "    $_" -Color Warn
                }
                Write-Log "  Se creara automaticamente al iniciar el backend." -Color Warn
            }
        }
    } else {
        Write-Log "  Script seed_superuser.py no encontrado en backend/scripts/" -Color Warn
        Write-Log "  El superusuario se creara al iniciar el backend." -Color Warn
    }
}

# ─── RESUMEN ───────────────────────────────────────────────────────────────────

Write-Log "`n+----------------------------------------------+" -Color Success
Write-Log "|  Configuracion completada                     |" -Color Success
Write-Log "+----------------------------------------------+" -Color Success
Write-Log "  Backend:       http://localhost:8000" -Color Info
Write-Log "  Documentacion: http://localhost:8000/docs" -Color Info
Write-Log "  Frontend:      http://localhost:5173" -Color Info
Write-Log "  Neo4j:         http://localhost:7474" -Color Info
Write-Log "+----------------------------------------------+" -Color Success
Write-Log "  Iniciar: .\scripts\start-windows.ps1" -Color Info
Write-Log "  Detener: .\scripts\stop-windows.ps1" -Color Info
Write-Log "+----------------------------------------------+" -Color Success

exit 0
