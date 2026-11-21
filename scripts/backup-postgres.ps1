# Requiere PostgreSQL client tools (pg_dump y pg_restore) en PATH.
# Ejecución: $env:DATABASE_URL='postgresql://...'; ./scripts/backup-postgres.ps1
# No se registran credenciales ni se imprimen en pantalla.
$ErrorActionPreference = 'Stop'
if (-not $env:DATABASE_URL) { throw 'Falta DATABASE_URL en esta terminal' }
if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) { throw 'No se encontró pg_dump. Instala PostgreSQL client tools.' }
if (-not (Get-Command pg_restore -ErrorAction SilentlyContinue)) { throw 'No se encontró pg_restore. Instala PostgreSQL client tools.' }
$directory = Join-Path (Get-Location) 'postgres-backups'
New-Item -ItemType Directory -Force -Path $directory | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$target = Join-Path $directory "Dentalweb_$stamp.dump"
& pg_dump --format=custom --no-owner --no-acl --file=$target --dbname=$env:DATABASE_URL
if ($LASTEXITCODE -ne 0) { Remove-Item -Path $target -Force -ErrorAction SilentlyContinue; throw 'pg_dump falló' }
& pg_restore --list $target | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'No se pudo leer el índice del respaldo' }
Write-Host "Respaldo creado: $target"
Write-Host 'ADVERTENCIA: Contiene datos sensibles. Cífralo y verifica restauración en otra base de pruebas.'
