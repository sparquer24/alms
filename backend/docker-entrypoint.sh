#!/bin/sh
set -e

echo "[entrypoint] running prisma generate (idempotent)..."
if command -v npx >/dev/null 2>&1; then
  npx prisma generate || echo "[entrypoint] prisma generate failed or no client to generate; continuing"
else
  echo "[entrypoint] npx not found; skipping prisma generate"
fi

if [ -n "$DATABASE_URL" ] && command -v npx >/dev/null 2>&1; then
  echo "[entrypoint] applying pending prisma migrations (prisma migrate deploy)..."
  RETRIES=10
  until npx prisma migrate deploy || [ $RETRIES -eq 0 ]; do
    RETRIES=$((RETRIES - 1))
    echo "[entrypoint] migrate deploy failed, retrying in 5s... ($RETRIES retries left)"
    sleep 5
  done
else
  echo "[entrypoint] DATABASE_URL not set or npx missing; skipping prisma migrate deploy"
fi

echo "[entrypoint] exec: $@"
exec "$@"
