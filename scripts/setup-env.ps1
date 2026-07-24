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
Write-Host "[v] .env creado desde .env.example" -ForegroundColor Green

$choice = Read-Host "?Generar SECRET_KEY aleatoria? (s/N)"
if ($choice -eq "s") {
    $randomKey = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
    $content = Get-Content -LiteralPath $envPath -Raw
    $content = $content -replace "SECRET_KEY=.*", "SECRET_KEY=$randomKey"
    Set-Content -LiteralPath $envPath -Value $content
    Write-Host "[v] SECRET_KEY generada" -ForegroundColor Green
}

Write-Host "[v] Configuración completada" -ForegroundColor Green
Write-Host "[i] Revisa $envPath y ajusta los valores según tu entorno." -ForegroundColor Cyan
