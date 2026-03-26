$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$source = Join-Path $projectRoot "index.html"
$backupsDir = Join-Path $projectRoot "backups"
$fallback = Join-Path $backupsDir "index.backup.html"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$versioned = Join-Path $backupsDir "index.$timestamp.html"

if (!(Test-Path $source)) {
  throw "index.html not found at $source"
}

if (!(Test-Path $backupsDir)) {
  New-Item -ItemType Directory -Path $backupsDir | Out-Null
}

Copy-Item -Path $source -Destination $fallback -Force
Copy-Item -Path $source -Destination $versioned -Force

Write-Host "Backup created:"
Write-Host "- Latest: $fallback"
Write-Host "- Versioned: $versioned"
