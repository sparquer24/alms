#!/usr/bin/env bash
# restore-docker-db.sh
#
# One-command restore of the ALMS PostgreSQL database into the Docker container
# (`alms-db`), automating the steps documented in
# docs/backend/DOCKER_DATABASE_RESTORE_GUIDE.md (§4 "Restore schema & data into Docker").
#
# The script:
#   ✔ starts the `db` compose service if the container isn't running
#   ✔ auto-picks the newest dump (backend/backups/db-*.dump, else backend/dumps/*.dump)
#   ✔ validates the dump, copies it into the container, restores with pg_restore
#   ✔ verifies table/row counts and (best-effort) Prisma migration status
#   ✔ refuses to restore over a non-empty database unless --wipe is given
#
# Usage:
#   bash restore-docker-db.sh                          # newest dump -> alms DB
#   bash restore-docker-db.sh -d backups/db-xxx.dump   # specific dump file
#   bash restore-docker-db.sh --wipe                   # drop & recreate schema first
#   bash restore-docker-db.sh --list                   # list available dumps and exit
#   bash restore-docker-db.sh --dbname alms_test --no-prisma --skip-start
#
# Options:
#   -d, --dump <path>     Custom-format (.dump) file. Relative paths are resolved
#                         against this script's folder (backend/). Default: newest
#                         in backend/backups/, falling back to backend/dumps/.
#   -c, --container <n>   Container name (default: alms-db)
#   -u, --user <u>        Database user  (default: alms)
#       --dbname <db>     Database name  (default: alms)
#       --wipe            DROP and recreate the public schema before restoring
#                         (destructive - overwrites ALL existing data)
#       --skip-start      Don't start/check the container (assume it is already up)
#       --no-verify       Skip post-restore verification queries
#       --no-prisma       Skip the `prisma migrate status` check
#   -y, --yes             Skip the interactive confirmation for --wipe
#   -l, --list            List available dumps and exit
#   -h, --help            Show this help and exit
#
# Manual equivalent (see guide §7.3 for a plain overwrite restore):
#   docker cp backend/backups/db-XXXX.dump alms-db:/tmp/restore.dump
#   docker exec alms-db sh -c 'pg_restore -U alms -d alms \
#     --clean --if-exists --no-owner --no-privileges /tmp/restore.dump'
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$REPO_ROOT/docker-compose.unified.yml"
BACKUP_DIR="$SCRIPT_DIR/backups"
DUMP_DIR="$SCRIPT_DIR/dumps"

CONTAINER="${CONTAINER:-alms-db}"
DB_USER="${DB_USER:-alms}"
DB_NAME="${DB_NAME:-alms}"
DUMP_FILE=""
WIPE=0
VERIFY=1
RUN_PRISMA=1
SKIP_START=0
YES=0
LIST=0

# ── tiny logging helpers ─────────────────────────────────────────────────────
log()  { printf '\033[1;34m[restore]\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m[ OK ]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[WARN ]\033[0m %s\n' "$*"; }
err()  { printf '\033[1;31m[ERROR]\033[0m %s\n' "$*" >&2; }

# ── usage (prints only this file's top comment block) ────────────────────────
usage() {
  awk 'NR==1{next} /^#/{sub(/^# ?/, ""); print; next} {exit}' "$0"
}

# ── CLI parsing ──────────────────────────────────────────────────────────────
while [ $# -gt 0 ]; do
  case "$1" in
    -d|--dump)       DUMP_FILE="${2:-}"; shift 2 ;;
    -c|--container)  CONTAINER="${2:-}"; shift 2 ;;
    -u|--user)       DB_USER="${2:-}";   shift 2 ;;
    --dbname)        DB_NAME="${2:-}";   shift 2 ;;
    --wipe)          WIPE=1;             shift ;;
    --skip-start)    SKIP_START=1;       shift ;;
    --no-verify)     VERIFY=0;           shift ;;
    --no-prisma)     RUN_PRISMA=0;       shift ;;
    -y|--yes)        YES=1;              shift ;;
    -l|--list)       LIST=1;             shift ;;
    -h|--help)       usage; exit 0 ;;
    *) err "Unknown option: $1"; usage; exit 1 ;;
  esac
done

# ── helpers ──────────────────────────────────────────────────────────────────
newest_dump_in() { # $1 = dir
  find "$1" -maxdepth 1 -name '*.dump' -printf '%T@ %p\n' 2>/dev/null \
    | sort -rn | head -1 | cut -d' ' -f2-
}

resolve_dump_path() { # $1 = user-supplied path
  local p="$1"
  case "$p" in
    /*) echo "$p" ;;
    *)  if [ -f "$SCRIPT_DIR/$p" ]; then echo "$SCRIPT_DIR/$p"; else echo "$p"; fi ;;
  esac
}

db_table_count() {
  docker exec "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
    "SELECT count(*) FROM pg_tables WHERE schemaname='public';" | tr -d ' \r'
}

psql_in() { # run a query in the container (local socket = trusted, no password needed)
  docker exec "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" "$@"
}

# ── list mode ────────────────────────────────────────────────────────────────
if [ "$LIST" = 1 ]; then
  echo "Available dumps:"
  for dir in "$BACKUP_DIR" "$DUMP_DIR"; do
    if [ -d "$dir" ] && ls "$dir"/*.dump >/dev/null 2>&1; then
      echo ""
      echo "  ${dir}  (container-backup / rds-dump)"
      ls -lh "$dir"/*.dump 2>/dev/null | awk '{ printf "    %s  %s\n", $5, $9 }'
    fi
  done
  exit 0
fi

# ── 1. pick the dump ─────────────────────────────────────────────────────────
if [ -n "$DUMP_FILE" ]; then
  DUMP_FILE="$(resolve_dump_path "$DUMP_FILE")"
  [ -f "$DUMP_FILE" ] || { err "Dump file not found: $DUMP_FILE"; exit 1; }
else
  DUMP_FILE="$(newest_dump_in "$BACKUP_DIR")"
  if [ -z "$DUMP_FILE" ]; then
    DUMP_FILE="$(newest_dump_in "$DUMP_DIR")"
  fi
  if [ -z "$DUMP_FILE" ]; then
    err "No dumps found in $BACKUP_DIR or $DUMP_DIR. Run backend/backup-db.sh first, or pass -d <dump>."
    exit 1
  fi
fi
log "Using dump: $DUMP_FILE"

# ── 2. ensure the container is up ────────────────────────────────────────────
if [ "$SKIP_START" = 1 ]; then
  docker ps --format '{{.Names}}' | grep -Fqx "$CONTAINER" \
    || { err "Container '$CONTAINER' is not running (--skip-start was given)."; exit 1; }
else
  if ! docker ps --format '{{.Names}}' | grep -Fqx "$CONTAINER"; then
    log "Container '$CONTAINER' not running - starting 'db' service..."
    if docker compose version >/dev/null 2>&1; then
      ( cd "$REPO_ROOT" && docker compose -f "$COMPOSE_FILE" up -d db )
    elif command -v docker-compose >/dev/null 2>&1; then
      ( cd "$REPO_ROOT" && docker-compose -f "$COMPOSE_FILE" up -d db )
    else
      err "docker compose is not available."
      exit 1
    fi
  fi
fi

log "Waiting for Postgres to accept connections..."
for _ in $(seq 1 60); do
  if docker exec "$CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
    ok "Postgres is ready"
    break
  fi
  sleep 1
done
docker exec "$CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1 \
  || { err "Postgres did not become ready in time."; exit 1; }

# ── 3. guardrail: refuse non-empty DB unless --wipe ──────────────────────────
TABLES="$(db_table_count)"
if [ "$TABLES" -gt 0 ] && [ "$WIPE" != 1 ]; then
  err "Database '$DB_NAME' already has $TABLES table(s)."
  err "Restoring over it would fail. Re-run with --wipe to drop & recreate the schema (destructive),"
  err "or restore into a fresh database with --dbname <name>."
  exit 1
fi

if [ "$WIPE" = 1 ]; then
  if [ "$YES" != 1 ]; then
    warn "This will DROP ALL objects in schema 'public' of database '$DB_NAME' and restore '$DUMP_FILE'."
    read -r -p "Type 'wipe' to continue: " ans || { err "Aborted (no input)."; exit 1; }
    [ "$ans" = "wipe" ] || { err "Aborted."; exit 1; }
  fi
  log "Dropping and recreating schema 'public'..."
  docker exec "$CONTAINER" sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" psql -U "$1" -d "$2" \
    -v ON_ERROR_STOP=1 -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"' _ "$DB_USER" "$DB_NAME"
  ok "Schema recreated"
fi

# ── 4. copy + validate + restore ─────────────────────────────────────────────
log "Copying dump into the container..."
docker cp "$DUMP_FILE" "$CONTAINER:/tmp/restore.dump"

log "Validating dump (pg_restore -l)..."
docker exec "$CONTAINER" sh -c 'pg_restore -l /tmp/restore.dump >/dev/null' \
  || { err "Dump validation failed - is this a valid custom-format (.dump) file?"; exit 1; }
ok "Dump is valid"

log "Restoring into $CONTAINER:$DB_NAME (this may take a few minutes)..."
START="$(date +%s)"
docker exec "$CONTAINER" sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" pg_restore -U "$1" -d "$2" \
  --no-owner --no-privileges --exit-on-error /tmp/restore.dump' _ "$DB_USER" "$DB_NAME"
DURATION="$(( $(date +%s) - START ))"
ok "Restore finished (${DURATION}s)"

docker exec "$CONTAINER" sh -c 'rm -f /tmp/restore.dump' >/dev/null 2>&1 || true

# ── 5. verification ──────────────────────────────────────────────────────────
if [ "$VERIFY" = 1 ]; then
  log "Verifying restored data..."
  echo "  Tables : $(db_table_count)"
  psql_in -c "SELECT schemaname || '.' || relname AS table, n_live_tup AS rows \
FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 10;"
  echo "  Total rows (approx): $(psql_in -tAc 'SELECT sum(n_live_tup) FROM pg_stat_user_tables;' | tr -d ' \r')"
fi

if [ "$RUN_PRISMA" = 1 ] && [ -f "$SCRIPT_DIR/.env" ] && command -v npx >/dev/null 2>&1; then
  log "Checking Prisma migration status..."
  ( cd "$SCRIPT_DIR" && npx prisma migrate status 2>&1 | tail -6 ) \
    || warn "prisma migrate status failed - run it manually: (cd backend && npx prisma migrate status)"
fi

log "Done. Dump restored: $DUMP_FILE"
