#!/usr/bin/env bash
set -euo pipefail
: "${BACKUP_DATABASE_URL:?Configurar BACKUP_DATABASE_URL para conexion directa}"
command -v pg_dump >/dev/null
command -v pg_restore >/dev/null
umask 077
dir="${DENTALWEB_BACKUP_DIR:-$(cd "$(dirname "$0")/.." && pwd)/private-backups}"
mkdir -p "$dir" && chmod 700 "$dir"
stamp="$(date -u +%Y%m%d_%H%M%S)"
tmp="$dir/Dentalweb_$stamp.dump.incomplete"
final="$dir/Dentalweb_$stamp.dump"
trap 'rm -f "$tmp"' EXIT
pg_dump --format=custom --no-owner --no-acl --dbname="$BACKUP_DATABASE_URL" --file="$tmp"
pg_restore --list "$tmp" >/dev/null
[ "$(wc -c < "$tmp")" -ge 1024 ] || { echo 'Respaldo sospechosamente pequeño' >&2; exit 1; }
mv "$tmp" "$final"
sha256sum "$final"
echo "Respaldo creado: $final"
echo 'Cifrar, sacar del servidor y restaurar periódicamente en base de prueba.'
