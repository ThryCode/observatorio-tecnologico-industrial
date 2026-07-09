<#
.SYNOPSIS
    Detiene los procesos del backend (uvicorn) y frontend (Vite/Node) del
    Observatorio Tecnológico Industrial en Windows.

.DESCRIPTION
    Busca y detiene los procesos de uvicorn y node que se estén ejecutando
    en los directorios del proyecto. No afecta servicios de infraestructura
    (PostgreSQL, Neo4j, Redis).

.PARAMETER Force
    Forzar terminación de procesos (Stop-Process -Force).
    Usar si los procesos no responden a una terminación normal.

.EXAMPLE
    .\scripts\stop-windows.ps1
    Detiene uvicorn y node del proyecto.

.EXAMPLE
    .\scripts\stop-windows.ps1 -Force
    Fuerza la detención de los procesos.
#>

param(
    [switch]$Force
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

function Stop-ProjectProcess {
    param(
        [string]$ProcessName,
        [string]$Label,
        [string]$WorkingDir
    )

    $procs = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -match [Regex]::Escape($WorkingDir) -or
        $_.MainWindowTitle -match [Regex]::Escape($WorkingDir)
    }

    if (-not $procs) {
        # Fallback: buscar por CommandLine (requiere admin para acceder)
        $procs = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
    }

    if (-not $procs) {
        Write-Log "  - $Label: no se encontraron procesos" -Color Info
        return
    }

    $count = 0
    foreach ($proc in $procs) {
        try {
            if ($Force) {
                $proc.Kill()
                Write-Log "  ✓ $Label (PID $($proc.Id)) forzado a terminar" -Color Warn
            } else {
                $proc.CloseMainWindow() | Out-Null
                if (-not $proc.WaitForExit(5000)) {
                    $proc.Kill()
                    Write-Log "  ⚠ $Label (PID $($proc.Id)) no respondió, forzado" -Color Warn
                } else {
                    Write-Log "  ✓ $Label (PID $($proc.Id)) terminado" -Color Success
                }
            }
            $count++
        } catch {
            Write-Log "  ✗ Error al detener $Label (PID $($proc.Id)): $_" -Color Error
        }
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────
Write-Log "╔═══════════════════════════════════════════════╗" -Color Step
Write-Log "║  Observatorio — Detener Servicios             ║" -Color Step
Write-Log "╚═══════════════════════════════════════════════╝" -Color Step

$rootDir = Resolve-Path (Join-Path $PSScriptRoot "..")

# Detener uvicorn (backend)
Write-Log "`n▶ Buscando procesos del backend..." -Color Step
Stop-ProjectProcess -ProcessName "uvicorn" -Label "uvicorn (backend)" -WorkingDir $rootDir

# Buscar también python corriendo uvicorn
Write-Log "`n▶ Buscando procesos de Python (uvicorn)..." -Color Step
$pythonProcs = Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -match "uvicorn" -and $_.CommandLine -match [Regex]::Escape($rootDir)
}
if ($pythonProcs) {
    foreach ($proc in $pythonProcs) {
        try {
            $proc.Kill()
            Write-Log "  ✓ Python/uvicorn (PID $($proc.Id)) terminado" -Color Success
        } catch {
            Write-Log "  ✗ Error: $_" -Color Error
        }
    }
} else {
    Write-Log "  - Python/uvicorn: no se encontraron procesos" -Color Info
}

# Detener node (frontend)
Write-Log "`n▶ Buscando procesos del frontend..." -Color Step
Stop-ProjectProcess -ProcessName "node" -Label "Node (frontend)" -WorkingDir $rootDir

# Detener npm si está corriendo
$npmProcs = Get-Process -Name "npm" -ErrorAction SilentlyContinue
if ($npmProcs) {
    foreach ($proc in $npmProcs) {
        try {
            $proc.Kill()
            Write-Log "  ✓ npm (PID $($proc.Id)) terminado" -Color Success
        } catch {
            Write-Log "  ✗ Error: $_" -Color Error
        }
    }
} else {
    Write-Log "  - npm: no se encontraron procesos" -Color Info
}

Write-Log "`n══════════════════════════════════════════════" -Color Success
Write-Log "  Procesos detenidos" -Color Success
Write-Log "══════════════════════════════════════════════" -Color Success
Write-Log "  Los servicios de infraestructura (PostgreSQL," -Color Info
Write-Log "  Neo4j, Redis) continúan corriendo." -Color Info
Write-Log "  Para detenerlos manualmente:" -Color Info
Write-Log "    Stop-Service postgresql-x64-15" -Color Info
Write-Log "    C:\neo4j\bin\neo4j.bat stop" -Color Info
Write-Log "    C:\redis\redis-cli.exe shutdown" -Color Info
Write-Log "══════════════════════════════════════════════" -Color Success
