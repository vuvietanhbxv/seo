param(
  [int]$Port = 5173,
  [string]$AppPath = $PSScriptRoot,
  [string]$BasePath = '/seo-ops',
  [string]$TaskName = 'SEO Ops Web'
)

$ErrorActionPreference = 'Stop'
$scriptPath = Join-Path $AppPath 'start-seo-ops.ps1'

if (-not (Test-Path -LiteralPath $scriptPath)) {
  Write-Host "Khong tim thay $scriptPath" -ForegroundColor Red
  exit 1
}

New-NetFirewallRule -DisplayName "SEO Ops $Port" -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow -ErrorAction SilentlyContinue | Out-Null

$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-ExecutionPolicy Bypass -File `"$scriptPath`" -Port $Port -AppPath `"$AppPath`" -BasePath `"$BasePath`""
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
Start-ScheduledTask -TaskName $TaskName

Write-Host "Da tao scheduled task '$TaskName'. App se chay tai http://IP-VPS:$Port$BasePath"
