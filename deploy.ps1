# deploy.ps1 — Sube cambios a Heroku automaticamente
Set-Location $PSScriptRoot

Write-Host "`n=== MyPersonWallets · Deploy a Heroku ===" -ForegroundColor Cyan

# 1. Verificar git
if (-not (Test-Path ".git")) {
    Write-Host "Inicializando repositorio git..." -ForegroundColor Yellow
    git init
    git add .
    git commit -m "init"
}

# 2. Agregar todos los archivos relevantes
Write-Host "`n[1/3] Agregando archivos..." -ForegroundColor Yellow
git add server.js package.json Procfile app.html panel.html wallet-b.html preview.html .gitignore

# 3. Commit con timestamp
$fecha = Get-Date -Format "yyyy-MM-dd HH:mm"
git commit -m "deploy $fecha" 2>&1 | Out-Null
Write-Host "      Commit listo" -ForegroundColor Green

# 4. Verificar remote heroku
$remotes = git remote 2>&1
if ($remotes -notmatch "heroku") {
    Write-Host "`n[!] No hay remote 'heroku'." -ForegroundColor Red
    $appName = Read-Host "    Nombre de tu app en Heroku (ej: probando-c84695b0c8b9)"
    heroku git:remote -a $appName
}

# 5. Push — intenta master, luego main
Write-Host "`n[2/3] Subiendo a Heroku..." -ForegroundColor Yellow
$pushResult = git push heroku master 2>&1
if ($LASTEXITCODE -ne 0) {
    $pushResult = git push heroku main 2>&1
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[3/3] Deploy exitoso!" -ForegroundColor Green
    # Obtener URL de la app
    $url = heroku info -s 2>$null | Select-String "web_url" | ForEach-Object { $_ -replace "web_url=","" }
    if ($url) {
        Write-Host "      URL: $url" -ForegroundColor Cyan
        Start-Process $url
    }
} else {
    Write-Host "`n[!] Error al subir. Detalle:" -ForegroundColor Red
    Write-Host $pushResult -ForegroundColor Red
    Write-Host "`nVerifica los logs con: heroku logs --tail" -ForegroundColor Yellow
}
