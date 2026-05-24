param(
  [int]$Port = 5173,
  [string]$AppPath = $PSScriptRoot,
  [string]$BasePath = '/'
)

$ErrorActionPreference = 'Stop'
Set-Location $AppPath

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host 'Node.js chua duoc cai. Hay cai Node.js LTS truoc: https://nodejs.org/' -ForegroundColor Red
  exit 1
}

$serverPath = Join-Path $AppPath 'server\seo-ops-server.cjs'
if (-not (Test-Path -LiteralPath $serverPath)) {
  Write-Host "Khong tim thay $serverPath" -ForegroundColor Red
  exit 1
}

$env:SEO_OPS_PORT = "$Port"
$env:SEO_OPS_HOST = '0.0.0.0'
$env:SEO_OPS_DB_DIR = Join-Path $AppPath 'db'
$env:SEO_OPS_BASE_PATH = $BasePath

Write-Host "SEO Ops dang chay tai http://0.0.0.0:$Port$BasePath"
Write-Host "Du lieu chung luu tai $env:SEO_OPS_DB_DIR"
node $serverPath
