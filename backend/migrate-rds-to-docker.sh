#!/usr/bin/env bash
# migrate-rds-to-docker.sh
#
# One-time migration: dump the AWS RDS `alms` database and restore it into the
# local Docker Postgres container (`alms-db`).
#
# Requirements:
#   - Docker running, `alms-db` container up (postgres:17-alpine, port 5432)
#   - backend/.env has the RDS DATABASE_URL
#
# Usage: bash migrate-rds-to-docker.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

URL="$(grep -E '^DATABASE_URL=' .env | head -1 | sed 's/^DATABASE_URL=//')"
if [ -z "$URL" ]; then
  echo "❌ No DATABASE_URL found in backend/.env"
  exit 1
fi

# Strip any query params (?connection_limit=...) for parsing
BASE_URL="${URL%%\?*}"
DBUSER="$(printf '%s' "$BASE_URL" | sed -E 's|.*://([^:]+):[^@]*@.*|\1|')"
DBPASS="$(printf '%s' "$BASE_URL" | sed -E 's|.*://[^:]+:([^@]*)@.*|\1|')"
DBHOST="$(printf '%s' "$BASE_URL" | sed -E 's|.*@([^:]+):[0-9]+/.*|\1|')"
DBPORT="$(printf '%s' "$BASE_URL" | sed -E 's|.*@[^:]+:([0-9]+)/.*|\1|')"
DBNAME="$(printf '%s' "$BASE_URL" | sed -E 's|.*/([^/?]+).*|\1|')"

echo "📍 Source  : $DBHOST:$DBPORT/$DBNAME (user: $DBUSER)"
echo "📍 Target  : Docker container alms-db (localhost:5432/alms)"

# 1. Dump from RDS (inside the alms-db container so no host mounts are needed)
echo "🔽 Dumping RDS -> alms-db:/tmp/alms-rds.dump ..."
docker exec alms-db sh -c 'PGPASSWORD="$1" pg_dump -h "$2" -p "$3" -U "$4" -d "$5" -Fc --no-owner --no-privileges -f /tmp/alms-rds.dump' \
  _ "$DBPASS" "$DBHOST" "$DBPORT" "$DBUSER" "$DBNAME"

# 2. Restore into the local database
echo "♻️  Restoring into alms-db (this may take a while) ..."
docker exec alms-db sh -c 'pg_restore -U alms -d alms --no-owner --no-privileges /tmp/alms-rds.dump'

# 3. Copy the dump to the host as a backup artifact
mkdir -p dumps
docker cp alms-db:/tmp/alms-rds.dump dumps/alms-rds.dump
ls -lh dumps/alms-rds.dump

echo "✅ Migration complete!"
