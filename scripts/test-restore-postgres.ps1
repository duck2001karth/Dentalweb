# IMPORTANTE: usar SOLAMENTE una base de pruebas vacía, nunca la de producción.
param([Parameter(Mandatory=$true)][string]$BackupFile)
$ErrorActionPreference = 'Stop'
if (-not $env:RESTORE_TEST_DATABASE_URL) { throw 'Falta RESTORE_TEST_DATABASE_URL (base vacía separada)' }
if (-not (Test-Path $BackupFile)) { throw 'No existe el archivo indicado' }
if ($env:BACKUP_DATABASE_URL -and $env:RESTORE_TEST_DATABASE_URL -eq $env:BACKUP_DATABASE_URL) {
  throw 'La base destino parece igual a la base origen. Operación denegada.'
}
Write-Host 'ADVERTENCIA: el destino debe estar vacío, aislado y sin datos de producción.'
$confirmation = Read-Host 'Escriba RESTAURAR para confirmar que la base destino es exclusiva de pruebas'
if ($confirmation -cne 'RESTAURAR') { throw 'Cancelado' }
& pg_restore '--dbname' $env:RESTORE_TEST_DATABASE_URL '--no-owner' '--no-acl' '--exit-on-error' '--single-transaction' $BackupFile
if ($LASTEXITCODE -ne 0) { throw 'Restauración fallida' }
Write-Host 'Restauración finalizada. Comparar tablas, integridad, sumas e iniciar pruebas funcionales.'
