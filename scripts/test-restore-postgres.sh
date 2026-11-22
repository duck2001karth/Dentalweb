#!/usr/bin/env bash
set -euo pipefail
: "${RESTORE_TEST_DATABASE_URL:?Configurar RESTORE_TEST_DATABASE_URL (BASE AISLADA VACIA)}"
: "${1:?Indicar backup.dump}"
if [[ -n "${BACKUP_DATABASE_URL:-}" && "$RESTORE_TEST_DATABASE_URL" == "$BACKUP_DATABASE_URL" ]]; then
  echo 'Destino coincide con origen' >&2; exit 1
fi
read -rp 'Escriba RESTAURAR si la base destino es NUEVA, VACIA y AISLADA: ' confirmation
[[ "$confirmation" == 'RESTAURAR' ]] || exit 1
pg_restore --dbname="$RESTORE_TEST_DATABASE_URL" --no-owner --no-acl --exit-on-error --single-transaction "$1"
echo 'Restauración ejecutada: comprobar conteos, constraints y operaciones funcionales.'
