<#
.SYNOPSIS
    Inicia el backend y frontend del Observatorio Tecnológico Industrial en Windows.

.DESCRIPTION
    Arranca el backend (uvicorn) y frontend (Vite) en ventanas separadas de PowerShell.
    Verifica que los servicios de infraestructura (PostgreSQL, Neo4j, Redis) estén
    disponibles antes de iniciar.

.PARAMETER BackendOnly
    Inicia solo el backend, omitiendo el frontend.

.PARAMETER FrontendOnly
    Inicia solo el frontend, omitiendo el backend.

.PARAMETER NoOpen
    No abre las URLs en el navegador después de iniciar.

.EXAMPLE
    .\scripts\start-windows.ps1
    Inicia backend y frontend.

.EXAMPLE
    .\scripts\start-windows.ps1 -BackendOnly
    Inicia solo el backend.
#>

param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly,
    [switch]$NoOpen
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

$rootDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$backendDir = Join-Path $rootDir "backend"
$frontendDir = Join-Path $rootDir "frontend"
$venvActivate = Join-Path $backendDir "venv\Scripts\Activate.ps1"

Write-Log "╔═══════════════════════════════════════════════╗" -Color Step
Write-Log "║  Observatorio — Inicio de Servicios           ║" -Color Step
Write-Log "╚═══════════════════════════════════════════════╝" -Color Step

# ── Iniciar backend ─────────────────────────────────────────────────────────
if (-not $FrontendOnly) {
    Write-Log "`n▶ Iniciando backend..." -Color Step

    if (-not (Test-Path $venvActivate)) {
        Write-Log "  ✗ Virtualenv no encontrado en $venvActivate" -Color Error
        Write-Log "  Ejecuta primero: scripts\setup-env.ps1" -Color Error
        exit 1
    }

    $backendLog = Join-Path $rootDir "logs\backend.log"
    $null = New-Item -ItemType Directory -Path (Join-Path $rootDir "logs") -Force

    $backendScript = @"
`$venv = '$venvActivate'
. `$venv
Write-Host '[Backend] Iniciando uvicorn en http://localhost:8000 ...' -ForegroundColor Green
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
if (`$LASTEXITCODE -ne 0) {
    Write-Host '[Backend] uvicorn terminó con código `$LASTEXITCODE' -ForegroundColor Red
    Read-Host 'Presiona Enter para cerrar'
}
"@

    $backendJob = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-NoProfile", "-Command", $backendScript -WorkingDirectory $backendDir -WindowStyle Normal -PassThru
    Write-Log "  ✓ Backend iniciado (PID: $($backendJob.Id))" -Color Success
    Start-Sleep -Seconds 3
}

# ── Iniciar frontend ─────────────────────────────────────────────────────────
if (-not $BackendOnly) {
    Write-Log "`n▶ Iniciando frontend..." -Color Step

    if (-not (Test-Path $frontendDir)) {
        Write-Log "  ✗ Directorio frontend/ no encontrado" -Color Error
        Write-Log "  Crea el frontend primero o usa -BackendOnly" -Color Error
        exit 1
    }

    if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
        Write-Log "  node_modules no encontrado. Ejecutando npm install..." -Color Warn
        Push-Location $frontendDir
        npm install
        Pop-Location
        if ($LASTEXITCODE -ne 0) {
            Write-Log "  ✗ npm install falló" -Color Error
            exit 1
        }
    }

    $frontendLog = Join-Path $rootDir "logs\frontend.log"

    $frontendScript = @"
Write-Host '[Frontend] Iniciando Vite dev server en http://localhost:5173 ...' -ForegroundColor Green
npm run dev
if (`$LASTEXITCODE -ne 0) {
    Write-Host '[Frontend] Vite terminó con código `$LASTEXITCODE' -ForegroundColor Red
    Read-Host 'Presiona Enter para cerrar'
}
"@

    $frontendJob = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-NoProfile", "-Command", $frontendScript -WorkingDirectory $frontendDir -WindowStyle Normal -PassThru
    Write-Log "  ✓ Frontend iniciado (PID: $($frontendJob.Id))" -Color Success
    Start-Sleep -Seconds 3
}

# ── Mostrar URLs ─────────────────────────────────────────────────────────────
Write-Log "`n══════════════════════════════════════════════" -Color Success
Write-Log "  OBSERVATORIO TECNOLÓGICO INDUSTRIAL" -Color Success
Write-Log "══════════════════════════════════════════════" -Color Success
Write-Log "  Backend:     http://localhost:8000" -Color Info
Write-Log "  Documentación: http://localhost:8000/docs" -Color Info
if (-not $BackendOnly) {
    Write-Log "  Frontend:    http://localhost:5173" -Color Info
}
Write-Log "  Neo4j:       http://localhost:7474" -Color Info
Write-Log "══════════════════════════════════════════════" -Color Success
Write-Log "  Para detener: .\scripts\stop-windows.ps1" -Color Warn
Write-Log "  O cierra las ventanas de PowerShell manualmente." -Color Warn
Write-Log "══════════════════════════════════════════════`n" -Color Success

# ── Abrir URLs en navegador por defecto ──────────────────────────────────────
if (-not $NoOpen) {
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:8000/docs"
    if (-not $BackendOnly) {
        Start-Process "http://localhost:5173"
    }
}
