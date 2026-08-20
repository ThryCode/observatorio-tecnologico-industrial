$ErrorActionPreference = 'Continue'
$project   = 'D:\Trabajo\Observatorio'
$tools     = 'D:\Tools'
$node      = 'D:\Tools\nodejs\node-v22.16.0-win-x64'
$psDir     = 'C:\Windows\System32\WindowsPowerShell\v1.0'
$javaHome  = 'C:\Users\Administrador\AppData\Local\Programs\Eclipse Adoptium\jdk-21.0.8.9-hotspot'
$redis     = 'D:\Tools\redis'
$neo4j     = 'D:\Tools\neo4j\neo4j-community-5.26.0'
$backend   = 'D:\Trabajo\Observatorio\backend'
$frontend  = 'D:\Trabajo\Observatorio\frontend'
$logs      = Join-Path $project 'logs'
if (-not (Test-Path $logs)) { New-Item -ItemType Directory -Path $logs | Out-Null }

function Start-Svc {
    param(
        [string]$Name,
        [string]$FilePath,
        [string]$ArgumentList,
        [string]$WorkingDir,
        [string]$ExtraPath
    )
    $out = Join-Path $logs "$Name.log"
    $err = Join-Path $logs "$Name.err.log"
    if ($ExtraPath) { $oldPath = $env:PATH; $env:PATH = "$ExtraPath;$env:PATH" }
    try {
        $p = Start-Process -FilePath $FilePath -ArgumentList $ArgumentList -WorkingDirectory $WorkingDir `
            -RedirectStandardOutput $out -RedirectStandardError $err -WindowStyle Normal -PassThru
        Write-Output "Iniciado: $Name (pid $($p.Id))"
    } catch {
        Write-Output "ERROR al iniciar $Name : $_"
    } finally {
        if ($ExtraPath) { $env:PATH = $oldPath }
    }
}

# Redis
Start-Svc -Name 'redis' -FilePath "$redis\redis-server.exe" -ArgumentList '--port 6379' -WorkingDir $redis

# Neo4j (consola). Usa el .ps1 directo para evitar el bat que invoca Powershell.
$neo4jArgs = @('-NoProfile','-ExecutionPolicy','Bypass','-File',"$neo4j\bin\neo4j.ps1",'console')
Start-Svc -Name 'neo4j' -FilePath 'powershell.exe' -ArgumentList $neo4jArgs -WorkingDir $neo4j -ExtraPath "$psDir;$javaHome\bin"

# Esperar a que Neo4j este listo (puerto 7687) antes de arrancar el backend,
# para que la sincronizacion del grafo en el lifespan tenga exito.
$neo4jReady = $false
for ($i = 0; $i -lt 60; $i++) {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect('127.0.0.1', 7687)
        $tcp.Close()
        $neo4jReady = $true
        break
    } catch { Start-Sleep -Seconds 1 }
}
if ($neo4jReady) { Write-Output 'Neo4j listo (7687).' } else { Write-Output 'ADVERTENCIA: Neo4j no respondio a tiempo.' }

# Backend (FastAPI / uvicorn)
Start-Svc -Name 'backend' -FilePath "$backend\venv\Scripts\python.exe" -ArgumentList '-m uvicorn app.main:app --host 127.0.0.1 --port 8000' -WorkingDir $backend -ExtraPath "$javaHome\bin"

# Frontend (Vite via npm.cmd)
Start-Svc -Name 'frontend' -FilePath "$node\npm.cmd" -ArgumentList 'run dev -- --host 127.0.0.1' -WorkingDir $frontend -ExtraPath $node

Write-Output ''
Write-Output 'Servicios iniciados. Logs en la carpeta logs/.'
Write-Output 'Abre http://127.0.0.1:5173'
Start-Sleep -Seconds 3