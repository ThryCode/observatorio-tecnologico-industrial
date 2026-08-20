@echo off
REM Detiene los servicios del Observatorio (Redis, Neo4j, Backend, Frontend).
echo Deteniendo servicios del Observatorio...
powershell -NoProfile -Command "Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -match 'redis|java|neo4j|uvicorn|node|vite|python' } | Stop-Process -Force -ErrorAction SilentlyContinue"
echo Servicios detenidos.
pause >nul