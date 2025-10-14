This file describes the recommended Docker workflows for this repository.

1) Backend (builds backend image and dev Postgres)

PowerShell example (run from repo root):

```powershell
# Build and start backend + postgres (uses compose inside backend folder)
docker compose -f backend/docker-compose.yml up --build

# Run in background
docker compose -f backend/docker-compose.yml up --build -d

# Stop
docker compose -f backend/docker-compose.yml down
```

2) Full project (backend + frontend + postgres)

PowerShell example (run from repo root):

```powershell
docker compose -f docker-compose.full.yml up --build

# background
docker compose -f docker-compose.full.yml up --build -d

# Stop
docker compose -f docker-compose.full.yml down
```

Notes and recommendations:
- Do NOT commit real secrets to `.env` files. Use `.env.example` and inject secrets in CI/CD or Docker secrets.
- For development with hot-reload use `backend/docker-compose.yml` which mounts source and starts ts-node-dev.
- The `backend/Dockerfile.prod` is optimized for production builds (multi-stage). Ensure `backend/.env` DATABASE_URL points to the intended DB.

Environment overrides (Postgres)
--------------------------------
The root `docker-compose.full.yml` uses the `POSTGRES_USER`, `POSTGRES_PASSWORD` and `POSTGRES_DB`
environment variables to initialize the Postgres service. These are set to sensible defaults in the
compose file but can be overridden per-developer via a `.env` file at the repo root or by exporting
environment variables in your shell before running docker compose.

PowerShell example (set for current session):

```powershell
$env:POSTGRES_USER = 'myuser'
$env:POSTGRES_PASSWORD = 'mypassword'
$env:POSTGRES_DB = 'mydb'
docker compose -f docker-compose.full.yml up --build
```

Unix / macOS example (bash/zsh):

```bash
export POSTGRES_USER=myuser
export POSTGRES_PASSWORD=mypassword
export POSTGRES_DB=mydb
docker compose -f docker-compose.full.yml up --build
```

Alternatively, copy `.env.example` to `.env` and edit the `POSTGRES_*` values there so docker-compose
reads them automatically when you run the compose command.

Quick smoke tests (PowerShell)

You can quickly verify the backend and frontend are responding with these PowerShell checks (run from repo root).

```powershell
# Check backend API (example: /users)
Invoke-WebRequest -UseBasicParsing http://localhost:3001/users | Select-Object StatusCode

# Check frontend app (root)
Invoke-WebRequest -UseBasicParsing http://localhost:5000/ | Select-Object StatusCode
```

Or run the bundled smoke-test script which returns exit code 0 on success and non-zero on failure:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\docker-smoke-test.ps1
```

CI integration
--------------

This repository now includes a lightweight GitHub Actions workflow (`.github/workflows/ci.yml`) that runs lint/build and frontend tests on push and PRs. It also provides an optional "integration" job which will spin up `docker-compose.full.yml` in the runner and run a few smoke checks.

To trigger the integration job manually from the Actions UI use the `workflow_dispatch` option and set the `integration` input to `true`. The integration job can also be triggered automatically when a commit message contains `[integration]`.

Notes about secrets and environment variables:
- By default the integration job uses the compose defaults. If you rely on custom Postgres credentials or other secrets, provide them to GitHub Actions as repository secrets and inject them into the runner environment in a custom workflow or by modifying the CI job. The example workflow does not ship secret values and is safe for public CI runs against the built-in dev Postgres image.
