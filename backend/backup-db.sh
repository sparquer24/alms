#!/usr/bin/env bash
# backup-db.sh
#
# Backs up the ALMS Docker Postgres database (container `alms-db`) using pg_dump
# into backend/backups/ and prunes backups older than KEEP_DAYS days.
#
# Usage:  bash backup-db.sh
# Env:    CONTAINER (default alms-db)   DB_USER (default alms)   DB_NAME (default alms)
#         KEEP_DAYS (default 14, keeps the N most recent days)   BACKUP_DIR (default <script dir>/backups)
#
# Note: on Windows the scheduled task runs as the logged-in user only (Docker
# Desktop also requires a login, so this is usually fine).
#
# Restore a backup later with:
#   docker cp backups/db-XXXX.dump alms-db:/tmp/restore.dump
#   docker exec alms-db sh -c 'pg_restore -U alms -d alms --clean --if-exists --no-owner --no-privileges /tmp/restore.dump'
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTAINER="${CONTAINER:-alms-db}"
DB_USER="${DB_USER:-alms}"
DB_NAME="${DB_NAME:-alms}"
KEEP_DAYS="${KEEP_DAYS:-14}"
BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/backups}"
LOG_FILE="$BACKUP_DIR/backup.log"

mkdir -p "$BACKUP_DIR"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

log "Starting backup (container: $CONTAINER, db: $DB_NAME, keep: ${KEEP_DAYS}d)..."

# 1. Container must be running (and Docker daemon reachable)
if ! docker ps --format '{{.Names}}' | grep -Fqx "$CONTAINER"; then
  log "ERROR: container '$CONTAINER' is not running (is Docker running?) - backup aborted"
  exit 1
fi

# 2. Dump inside the container (sh -c keeps the /tmp path intact on Windows)
if ! docker exec "$CONTAINER" sh -c "pg_dump -U \"$DB_USER\" -d \"$DB_NAME\" -Fc -f /tmp/alms-backup.dump"; then
  log "ERROR: pg_dump failed"
  exit 1
fi

# 3. Validate the dump is readable (TOC check)
if ! docker exec "$CONTAINER" sh -c 'pg_restore -l /tmp/alms-backup.dump >/dev/null'; then
  log "ERROR: dump validation failed (pg_restore -l)"
  exit 1
fi

# 4. Copy the dump to the host, then remove the temp file from the container
TIMESTAMP="$(date '+%Y%m%d-%H%M%S')"
DUMP_FILE="$BACKUP_DIR/db-$TIMESTAMP.dump"
if ! docker cp "$CONTAINER:/tmp/alms-backup.dump" "$DUMP_FILE"; then
  log "ERROR: docker cp failed"
  exit 1
fi
docker exec "$CONTAINER" sh -c 'rm -f /tmp/alms-backup.dump' 2>/dev/null || true

# 5. Prune backups older than KEEP_DAYS (keeps the KEEP_DAYS most recent days)
PRUNE_AGE="$((KEEP_DAYS - 1))"
[ "$PRUNE_AGE" -lt 0 ] && PRUNE_AGE=0
find "$BACKUP_DIR" -maxdepth 1 -name 'db-*.dump' -mtime +"$PRUNE_AGE" -delete 2>/dev/null || true
KEPT="$(find "$BACKUP_DIR" -maxdepth 1 -name 'db-*.dump' | wc -l)"

# 6. Report
SIZE="$(du -h "$DUMP_FILE" | cut -f1)"
log "OK: backup written to $DUMP_FILE ($SIZE), $KEPT backup(s) kept"
