@echo off
REM =============================================================================
REM Observatorio Tecnologico Industrial - Arranque (Windows nativo)
REM Ejecuta start_services.ps1, que levanta Redis, Neo4j, Backend y Frontend
REM en ventanas separadas. Requiere las herramientas en D:\Tools.
REM =============================================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_services.ps1"
echo.
echo Presiona cualquier tecla para cerrar esta ventana (los servicios siguen corriendo).
pause >nul