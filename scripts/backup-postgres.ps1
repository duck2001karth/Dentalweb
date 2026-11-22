# Windows PowerShell / PowerShell 7, sin Python. Programable con Programador de tareas.
# Establecer BACKUP_DATABASE_URL con conexión directa. Evitar conexiones pooler de transacción.
$ErrorActionPreference = 'Stop'
if (-not $env:BACKUP_DATABASE_URL) { throw 'Falta BACKUP_DATABASE_URL en el entorno seguro' }
foreach ($cmd in @('pg_dump', 'pg_restore')) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) { throw "Falta $cmd (PostgreSQL client tools)" }
}
$directory = if ($env:DENTALWEB_BACKUP_DIR) { $env:DENTALWEB_BACKUP_DIR } else { Join-Path $PSScriptRoot '..\private-backups' }
$directory = [System.IO.Path]::GetFullPath($directory)
New-Item -ItemType Directory -Force -Path $directory | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$temp = Join-Path $directory "Dentalweb_$stamp.dump.incomplete"
$dest = Join-Path $directory "Dentalweb_$stamp.dump"
try {
  & pg_dump '--format=custom' '--no-owner' '--no-acl' '--dbname' $env:BACKUP_DATABASE_URL '--file' $temp
  if ($LASTEXITCODE -ne 0) { throw 'pg_dump falló' }
  & pg_restore '--list' $temp 2>$null | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'pg_restore --list no pudo leer el archivo' }
  if ((Get-Item $temp).Length -lt 1024) { throw 'Respaldo demasiado pequeño; revisar contenido' }
  Move-Item -Path $temp -Destination $dest -ErrorAction Stop
  $checksum = (Get-FileHash $dest -Algorithm SHA256).Hash
  Write-Host "OK: respaldo verificado con índice y SHA256: $checksum"
  Write-Host "Archivo: $dest"
  Write-Warning 'Índice válido NO garantiza restaurabilidad; ejecutar prueba de restauración en base aislada.'
  Write-Warning 'Cifrar y copiar a destino fuera del servidor. No guardar en Git ni en public/.'
} finally {
  Remove-Item -Path $temp -Force -ErrorAction SilentlyContinue
}
