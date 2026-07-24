# F3-16: Fix setup-env.ps1

**Etiquetas:** `fase-3`, `scripts`, `bug`
**Hito:** Fase 3 — Producción
**Depende de:** Ninguna
**Subagente:** `backend-coder`

---

## Descripción

El archivo `scripts/setup-env.ps1` tiene errores de sintaxis (mencionado en AGENTS.md como issue conocido). Se necesita reescribirlo para que funcione correctamente en Windows PowerShell 5.1.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `scripts/setup-env.ps1` | Reescribir completamente |

## Especificación técnica

El script debe:

1. Verificar que `.env` no existe (para no sobrescribir configuración existente)
2. Copiar `.env.example` a `.env`
3. Preguntar al usuario si quiere generar una `SECRET_KEY` aleatoria
4. Configurar valores por defecto para desarrollo

```powershell
<#
.SYNOPSIS
    Configura el archivo .env para el Observatorio Tecnológico Industrial
.DESCRIPTION
    Copia .env.example a .env y opcionalmente genera una SECRET_KEY aleatoria.
    No sobrescribe un .env existente.
#>

$envPath = "..\.env"
$examplePath = "..\.env.example"

if (Test-Path -LiteralPath $envPath) {
    Write-Host "[!] .env ya existe en $envPath" -ForegroundColor Yellow
    Write-Host "[i] Elimínalo manualmente si quieres regenerarlo." -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path -LiteralPath $examplePath)) {
    Write-Host "[!] .env.example no encontrado en $examplePath" -ForegroundColor Red
    exit 1
}

Copy-Item -LiteralPath $examplePath -Destination $envPath
Write-Host "[✓] .env creado desde .env.example" -ForegroundColor Green

$choice = Read-Host "¿Generar SECRET_KEY aleatoria? (s/N)"
if ($choice -eq "s") {
    $randomKey = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
    $content = Get-Content -LiteralPath $envPath -Raw
    $content = $content -replace "SECRET_KEY=.*", "SECRET_KEY=$randomKey"
    Set-Content -LiteralPath $envPath -Value $content
    Write-Host "[✓] SECRET_KEY generada" -ForegroundColor Green
}

Write-Host "[✓] Configuración completada" -ForegroundColor Green
Write-Host "[i] Revisa $envPath y ajusta los valores según tu entorno." -ForegroundColor Cyan
```

## Criterios de aceptación

- [ ] `scripts/setup-env.ps1` se ejecuta sin errores de sintaxis en PowerShell 5.1
- [ ] Copia `.env.example` a `.env` si no existe
- [ ] No sobrescribe `.env` existente
- [ ] Genera `SECRET_KEY` aleatoria si el usuario lo solicita
- [ ] Mensajes claros con colores (Verde/Amarillo/Rojo/Cian)

## Riesgos

- **Ninguno**: Script de utilidad, no afecta código en ejecución.
