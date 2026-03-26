$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$target = Join-Path $projectRoot "index.html"
$backup = Join-Path $projectRoot "backups\index.backup.html"

if (!(Test-Path $backup)) {
  throw "Backup file not found at $backup"
}

Copy-Item -Path $backup -Destination $target -Force

Write-Host "index.html restored from backup successfully."
