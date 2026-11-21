#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?Debes establecer DATABASE_URL}"
command -v pg_dump >/dev/null || { echo 'Instala PostgreSQL client tools (pg_dump)' >&2; exit 1; }
command -v pg_restore >/dev/null || { echo 'Instala PostgreSQL client tools (pg_restore)' >&2; exit 1; }
mkdir -p postgres-backups
chmod 700 postgres-backups
file="postgres-backups/Dentalweb_$(date +%Y%m%d_%H%M%S).dump"
pg_dump --format=custom --no-owner --no-acl --file="$file" --dbname="$DATABASE_URL"
pg_restore --list "$file" >/dev/null
chmod 600 "$file"
printf 'Respaldo creado: %s\nContiene información sensible: cifra el archivo y verifica restauración en staging.\n' "$file"
