# ALMS Deployment Scripts

> End-to-end deployment automation for ALMS (Arms License Management System)

## Overview

This folder contains scripts to deploy **ALMS** — backend (NestJS), frontend (Next.js), database (PostgreSQL/Prisma), and infrastructure (Docker, Nginx, S3/CloudFront) — in one command.

### Scripts

| File | Platform | Description |
|------|----------|-------------|
| `deploy.sh` | Linux / macOS / EC2 (Bash) | Full deployment: backend Docker, Prisma migrations, frontend build + S3/CloudFront |
| `deploy.ps1` | Windows (PowerShell) | Full deployment: backend Docker, Prisma migrations, frontend build + S3/CloudFront |

## Quick Start

### Prerequisites

- **Linux / EC2**: Bash, Docker, Docker Compose, Node.js 22+, AWS CLI (for S3 deploy)
- **Windows**: PowerShell 5.1+, Docker Desktop, Node.js 22+, AWS CLI (for S3 deploy)

### 1. Clone the repo & prepare environment

```bash
cd /path/to/alms
```

Ensure `.env.prod` exists at the project root and `backend/.env.prod` with all required variables:

```env
# Root .env.prod
DATABASE_URL=postgresql://user:password@rds-host:5432/alms_prod
JWT_SECRET=your-super-secret
NEXT_PUBLIC_API_URL=https://alms.sparquer.com/api
```

### 2. Run deployment

```bash
# Linux / EC2
chmod +x deploy/deploy.sh
./deploy/deploy.sh

# With options
./deploy/deploy.sh --skip-s3          # Deploy everything except S3 upload
./deploy/deploy.sh --skip-migrations  # Deploy without running migrations
./deploy/deploy.sh --docker-only      # Only build and start Docker services
./deploy/deploy.sh --frontend-only    # Only build and deploy frontend
```

```powershell
# Windows PowerShell
.\deploy\deploy.ps1
```

## What It Does

The script executes these steps in order:

### Step 1: Check Prerequisites
- Docker & Docker Compose installed
- Node.js & npm installed
- AWS CLI installed (if S3 deployment enabled)
- Env files present

### Step 2: Database — Prisma
- Generate Prisma client (`npx prisma generate`)
- Run pending migrations (`npx prisma migrate deploy`)

### Step 3: Backend — Docker Build & Deploy
- Build Docker image using `backend/Dockerfile.prod`
- Start (or restart) the `alms-backend-prod` container via `docker-compose.prod.yml`
- Wait for health check to pass

### Step 4: Frontend — Build & Deploy
- Install frontend dependencies
- Build Next.js app (output: standalone)
- Upload static assets (`_next/static/*`, `public/*`) to S3 bucket
- Optionally: Invalidate CloudFront cache
- Optionally: Copy standalone server files to EC2 (if `EC2_HOST` is set)

### Step 5: Verify
- Health check: backend API endpoint
- Health check: frontend HTTP endpoint
- Print deployment summary

## Configuration

All configuration is at the top of each script (both `deploy.sh` and `deploy.ps1`):

```bash
# ─── CONFIGURATION ───────────────────────────────────────
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Backend
BACKEND_COMPOSE_FILE="docker-compose.prod.yml"
BACKEND_CONTAINER="alms-backend-prod"
BACKEND_PORT=3001

# Frontend
FRONTEND_S3_BUCKET="alms-frontend-prod-bucket"
FRONTEND_CLOUDFRONT_ID=""            # Leave empty to skip CF invalidation
FRONTEND_AWS_REGION="ap-south-1"

# Prisma
PRISMA_DIR="backend/prisma"

# EC2 standalone server (optional)
EC2_HOST=""                          # user@host, e.g. ubuntu@54.123.45.67
EC2_FRONTEND_DIR="/home/alms/frontend"
```

## Environment Variables Required

### `.env.prod` (project root)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for JWT token signing |
| `NEXT_PUBLIC_API_URL` | Public API URL |

## Deployment Architecture

```
                    ┌──────────────────────────────┐
                    │    CloudFront CDN             │
                    │   alms.sparquer.com           │
                    └──────┬───────────────┬────────┘
                           │               │
               ┌───────────┘               └───────────┐
               ▼                                       ▼
    ┌──────────────────────┐              ┌──────────────────────┐
    │   S3 Static Assets   │              │   EC2 Instance       │
    │   (_next/static/*)   │              │                      │
    │                      │              │  Nginx (port 443)    │
    │   Bucket: alms-      │              │   ├── /api/* → Docker│
    │   frontend-prod-     │              │   │   backend:3001   │
    │   bucket             │              │   └── /* → Docker    │
    └──────────────────────┘              │       frontend:5001  │
                                          └──────────────────────┘
```

## Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Docker build fails | Out of memory | `sudo fallocate -l 4G /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile` |
| Prisma migration fails | DB connection | Check `DATABASE_URL`, RDS security group inbound rules |
| Frontend build OOM | Memory limit | Set `NODE_OPTIONS=--max-old-space-size=8192` |
| S3 upload fails | AWS credentials | Run `aws configure` or set env vars |
| Container restart loop | Missing env vars | Check `.env.prod` files |
