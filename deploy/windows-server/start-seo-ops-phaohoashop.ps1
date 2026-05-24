param(
  [int]$Port = 5173,
  [string]$AppPath = 'C:\xampp\htdocs\phaohoashop',
  [string]$BasePath = '/'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $AppPath)) {
  Write-Host "Khong tim thay thu muc app: $AppPath" -ForegroundColor Red
  exit 1
}

Set-Location $AppPath

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host 'Node.js chua duoc cai. Hay cai Node.js LTS truoc: https://nodejs.org/' -ForegroundColor Red
  exit 1
}

$serverPath = Join-Path $AppPath 'server\seo-ops-server.cjs'
if (-not (Test-Path -LiteralPath $serverPath)) {
  Write-Host "Khong tim thay server: $serverPath" -ForegroundColor Red
  exit 1
}

$env:SEO_OPS_PORT = "$Port"
$env:SEO_OPS_HOST = '0.0.0.0'
$env:SEO_OPS_BASE_PATH = $BasePath
$env:SEO_OPS_DB_DIR = Join-Path $AppPath 'db'

Write-Host "SEO Ops dang chay tai http://127.0.0.1:$Port$BasePath"
Write-Host "Thu muc app: $AppPath"
Write-Host "Du lieu chung: $env:SEO_OPS_DB_DIR\seo-ops-data.json"

node $serverPath
