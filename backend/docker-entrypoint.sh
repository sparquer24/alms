#!/bin/sh
set -e

echo "[entrypoint] running prisma generate (idempotent)..."
if command -v npx >/dev/null 2>&1; then
  npx prisma generate || echo "[entrypoint] prisma generate failed or no client to generate; continuing"
else
  echo "[entrypoint] npx not found; skipping prisma generate"
fi

echo "[entrypoint] exec: $@"
exec "$@"
