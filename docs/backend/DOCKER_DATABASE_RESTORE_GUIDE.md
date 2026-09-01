# Docker Database Restore & Full-Stack Startup Guide

> **Purpose:** How to move the ALMS schema + data into the local Docker Postgres
> (`alms-db`) and bring up the full stack (backend + frontend + database).
>
> **Last verified:** 2026-08-07 · Docker Desktop, `postgres:17-alpine` (PostgreSQL 17.10)

---

## 1. Overview

The unified Docker setup (`docker-compose.unified.yml` at the repo root) runs three services:

| Service         | Container           | Image                 | Port                    |
|-----------------|---------------------|-----------------------|-------------------------|
| `db`            | `alms-db`           | `postgres:17-alpine`  | `127.0.0.1:5432` (host) |
| `backend-prod`  | `alms-backend-prod` | `alms-backend-prod`   | `3001`                  |
| `frontend-prod` | `alms-frontend-prod`| `alms-frontend-prod`  | `5001`                  |

- The database **data lives in the named Docker volume `alms_pgdata`**.
- **Removing the container or volume wipes the database.** If that happens,
  re-restore from a dump (see [§4](#4-restore-schema--data-into-docker)).
- The backend does **not** auto-apply Prisma migrations on startup — the schema
  is expected to already exist (restore brings it, including `_prisma_migrations`).

## 2. Configuration

All env files already point at the local Docker Postgres:

```env
DATABASE_URL=postgresql://alms:<password>@localhost:5432/alms
```

Files: `backend/.env`, `.env`, `.env.prod` (must all match).

The `db` service in `docker-compose.unified.yml` initializes itself with:

```yaml
db:
  image: postgres:17-alpine
  container_name: alms-db
  environment:
    POSTGRES_USER: alms
    POSTGRES_PASSWORD: <password>   # must match the password in DATABASE_URL
    POSTGRES_DB: alms
  ports:
    - "127.0.0.1:5432:5432"
  volumes:
    - alms_pgdata:/var/lib/postgresql/data
```

> ⚠️ If `POSTGRES_PASSWORD` and the `DATABASE_URL` password ever diverge, the
> backend will fail to connect. Keep them in sync.

## 3. Prerequisites

- Docker Desktop running (Docker Engine + `docker compose` v2)
- Repo cloned at `C:\Users\durga\Desktop\office\alms` (or equivalent)
- Node deps installed in `backend/` (for `prisma` CLI checks)

## 4. Restore schema & data into Docker

Use this whenever `alms-db` is fresh or was wiped (empty `public` schema).

### 4.0 One-command restore (recommended)

`backend/restore-docker-db.sh` automates all the steps below in a single command:

```bash
cd backend
bash restore-docker-db.sh                                     # newest dump -> alms DB
bash restore-docker-db.sh --list                             # list available dumps
bash restore-docker-db.sh -d backups/db-20260807-145125.dump # specific dump
bash restore-docker-db.sh --wipe                             # drop & recreate schema first (destructive)
```

It starts `alms-db` if needed, auto-picks the newest `backend/backups/db-*.dump`
(fallback: `backend/dumps/*.dump`), validates the dump, restores with `pg_restore`,
verifies table/row counts, and checks Prisma migration status. It refuses to restore
over a non-empty database unless `--wipe` is given. Manual steps below for reference.

### 4.1 Start the database

```bash
cd /c/Users/durga/Desktop/office/alms
docker compose -f docker-compose.unified.yml up -d db
```

Wait until Postgres accepts connections:

```bash
for i in $(seq 1 30); do
  docker exec alms-db pg_isready -U alms -d alms >/dev/null 2>&1 && { echo "DB ready"; break; }
  sleep 1
done
```

Confirm it is empty:

```bash
docker exec alms-db psql -U alms -d alms -tAc \
  "SELECT count(*) FROM pg_tables WHERE schemaname='public';"   # expect 0
```

### 4.2 Pick a source dump

Available artifacts under `backend/`:

| File | Source | When to use |
|------|--------|-------------|
| `backups/db-<timestamp>.dump` | `pg_dump -Fc` of the **Docker DB** | Preferred — exact state previously in Docker |
| `dumps/alms-rds.dump` | `pg_dump -Fc` of **AWS RDS** | Fallback / original source |
| `data-exports/full-export-*.json` | JSON export via `fetch-all-data.js` | Reference only (not for restore) |

> Custom-format (`-Fc`) dumps contain **schema + data + `_prisma_migrations`**
> history, so one restore gets you everything.

### 4.3 Restore

```bash
cd /c/Users/durga/Desktop/office/alms/backend

# 1. Copy the dump into the container
docker cp backups/db-20260807-122638.dump alms-db:/tmp/restore.dump

# 2. Restore (PGPASSWORD is taken from the container env set by compose)
docker exec alms-db sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" pg_restore -U alms -d alms \
     --no-owner --no-privileges --exit-on-error /tmp/restore.dump'

# 3. Clean up the temp file
docker exec alms-db sh -c 'rm -f /tmp/restore.dump'
```

Expected result: exit code `0` and no errors.

### 4.4 Verify the restore

```bash
# Table count (expect 46)
docker exec alms-db psql -U alms -d alms -tAc \
  "SELECT count(*) FROM pg_tables WHERE schemaname='public';"

# Total rows (expect ~2,555)
docker exec alms-db psql -U alms -d alms -tAc \
  "SELECT sum(n_live_tup) FROM pg_stat_user_tables;"

# Spot checks
docker exec alms-db psql -U alms -d alms -tAc 'SELECT count(*) FROM "Users";'      # 157
docker exec alms-db psql -U alms -d alms -tAc 'SELECT count(*) FROM "Licenses";'   # 21

# Prisma sees everything applied (from backend/)
cd backend && npx prisma migrate status
# → "Database schema is up to date!"
```

## 5. Start the full stack

```bash
cd /c/Users/durga/Desktop/office/alms
docker compose -f docker-compose.unified.yml up -d --build
```

> `--build` is only needed after source changes; on a warm cache it is fast.

Check status:

```bash
docker compose -f docker-compose.unified.yml ps
# NAME                 STATUS
# alms-db              Up (healthy)
# alms-backend-prod    Up (healthy)
# alms-frontend-prod   Up (healthy)
```

## 6. Verify the stack

```bash
# Backend health (expect 200 + "database":"connected")
curl -s http://localhost:3001/api/health
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3001/api/health/ready   # 200

# Frontend (expect 200)
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:5001/
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:5001/login              # 200
```

Sample backend health response:

```json
{"status":"ok","timestamp":"...","database":"connected","environment":"production","port":"3001"}
```

Access the app at `http://localhost:5001`.

## 7. Backups

### 7.1 Manual backup (Docker DB)

```bash
cd backend && bash backup-db.sh
```

- Writes `backend/backups/db-<timestamp>.dump` (custom format)
- Keeps the most recent 14 days (`KEEP_DAYS` env override)
- Logs to `backend/backups/backup.log`

### 7.2 Scheduled backup

```bash
cd backend && bash setup-backup-schedule.sh 02:00
```

- Windows: creates Task Scheduler task `alms-db-backup` via `backup-db.cmd`
- Linux/macOS: adds a cron entry tagged `# alms-db-backup`

### 7.3 Restore a backup (overwrites current data)

```bash
docker cp backend/backups/db-<timestamp>.dump alms-db:/tmp/restore.dump
docker exec alms-db sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" pg_restore -U alms -d alms \
  --clean --if-exists --no-owner --no-privileges /tmp/restore.dump'
```

### 7.4 One-time migration from AWS RDS

```bash
# backend/.env must temporarily contain the RDS DATABASE_URL, then:
cd backend && bash migrate-rds-to-docker.sh
```

Dumps RDS → restores into `alms-db` → copies the dump to `backend/dumps/`.

## 8. Troubleshooting

| Symptom | Cause / Fix |
|---------|-------------|
| `docker ps` shows no `alms-db` | Container/volume was removed. Run `docker compose -f docker-compose.unified.yml up -d db` and re-restore from `backend/backups/` (see §4). |
| Backend health shows `"database":"error"` or crashes on DB connect | `DATABASE_URL` password ≠ `POSTGRES_PASSWORD`, or DB not running. Verify both against `docker-compose.unified.yml` and the `.env` files. |
| `prisma migrate status` reports drift | All 15 migrations are reconciled locally, including `20260715151500_add_place_of_birth_to_renewal_personal_details`. Note the migration history cannot be replayed from scratch (`20260626200000_reconcile_schema_changes` references `RenewalCriminalHistories`, which earlier migrations never created) - always restore from a dump instead of `migrate deploy`. |
| Restore fails with role/owner errors | Use `--no-owner --no-privileges` (as above). |
| Compose warning: "attribute `version` is obsolete" | Cosmetic. The `version: '3.8'` line can be removed from `docker-compose.unified.yml`. |
| `backend/db.env` looks wrong (`POSTGRES_USER=postgres`) | Unused leftover — nothing references `db.env`; the compose file sets its own env. |

## 9. Quick reference (verified commands, 2026-08-07)

```bash
# Restore into fresh Docker DB
docker compose -f docker-compose.unified.yml up -d db
docker cp backend/backups/db-20260807-122638.dump alms-db:/tmp/restore.dump
docker exec alms-db sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" pg_restore -U alms -d alms \
  --no-owner --no-privileges --exit-on-error /tmp/restore.dump'

# Start full stack
docker compose -f docker-compose.unified.yml up -d --build

# Verify
curl -s http://localhost:3001/api/health          # 200, database: connected
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:5001/   # 200
```

Restored state (verified): **46 tables · 2,555 rows · 15 migrations applied · backend/frontend healthy.**
