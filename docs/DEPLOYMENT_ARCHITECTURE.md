# ALMS Deployment Architecture

## Overview

```
                     ┌──────────────────────────────────────┐
                     │         CloudFront CDN                │
                     │        alms.sparquer.com              │
                     └──────────┬───────────────┬────────────┘
                                │               │
                    ┌───────────┘               └───────────┐
                    ▼                                       ▼
        ┌──────────────────────┐              ┌──────────────────────┐
        │   S3 Static Hosting  │              │   EC2 Instance       │
        │   (frontend static   │              │                      │
        │    assets + pages)   │              │  Nginx (port 443)    │
        │                      │              │   ├── /api/* → Docker│
        │   Bucket: alms-      │              │   │   backend:3001   │
        │   frontend-prod-     │              │   └── /ws/* → Docker │
        │   bucket             │              │       backend:3001   │
        └──────────────────────┘              └──────────────────────┘
```

## Components

### 1. Frontend → S3 + CloudFront

| Item | Value |
|---|---|
| Build output | `output: 'standalone'` → `.next/standalone/` |
| Static assets | Uploaded to S3 bucket `alms-frontend-prod-bucket` |
| CDN | CloudFront distribution at `alms.sparquer.com` |
| Domain | `alms.sparquer.com` |

**CloudFront Behaviors:**

| Path Pattern | Origin | Notes |
|---|---|---|
| `/_next/static/*` | **S3 bucket** | Long cache TTL (1 year). Edge-cached static assets. |
| `/public/*` | **S3 bucket** | Public files (favicon, robots.txt, etc.). |
| `/api/*` | **EC2 / ALB** → Nginx → Backend Docker (:3001) | API proxied to backend. No caching. |
| `/ws/*` | **EC2 / ALB** → Nginx → Backend Docker (:3001) | WebSocket. No caching. |
| Default (`*`) | **EC2 / ALB** → Nginx → Next.js standalone (:5001) | SSR pages, middleware, rewrites. |

> **Note:** Since the app uses SSR (`getServerSideProps`), middleware, and rewrites, the Next.js standalone server runs **alongside the backend** on EC2 to handle dynamic pages. Static assets (CSS, JS, images) are served directly from S3 via CloudFront for maximum performance. The `deploy.ps1` script uploads only cacheable static assets (`_next/static/*`, `public/*`) to S3 — the standalone server files go directly to EC2.

### 2. Backend → Docker on EC2

| Item | Value |
|---|---|
| Container | `alms-backend-prod` |
| Internal port | 3001 |
| API domain | `api.alms.sparquer.com` or `alms.sparquer.com/api/*` |
| Database | AWS RDS PostgreSQL |

## Deployment Steps

### Step 1: Build & Deploy Frontend to S3

```bash
cd frontend

# Install dependencies
npm install

# Build the app (output: standalone)
npm run build

# Deploy to S3 + CloudFront
# Ensure AWS credentials are configured first:
#   $env:AWS_ACCESS_KEY_ID = "YOUR_KEY"
#   $env:AWS_SECRET_ACCESS_KEY = "YOUR_SECRET"
#   $env:AWS_SESSION_TOKEN = "YOUR_TOKEN"   # if using temporary creds
.\deploy.ps1
```

The `deploy.ps1` script will:
1. Build the Next.js app (output: standalone, keeps SSR/middleware/rewrites)
2. Upload only cacheable static assets (`_next/static/*`, `public/*`) to S3
3. Create CloudFront invalidation (if distribution ID is set)
4. Print instructions to copy the standalone server to EC2

### Step 2: Deploy Backend via Docker on EC2

```bash
# On your EC2 instance, from the project root:

# Create .env.prod file with your production variables
# (DATABASE_URL, JWT_SECRET, etc.)

# Build and start the backend container
docker-compose -f docker-compose.prod.yml up -d --build

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Step 3: Configure CloudFront

1. **Create a CloudFront distribution** in AWS Console
2. **Add origins:**
   - S3 origin: `alms-frontend-prod-bucket` (for static assets)
   - Custom origin: Your EC2 instance IP or ALB DNS (for API and dynamic pages)
3. **Add behaviors:**
   - `/_next/static/*` → **S3 origin** (cache TTL: 1 year)
   - `/public/*` → **S3 origin** (cache TTL: 1 year)
   - `/api/*` → **Custom origin (EC2)** → Nginx → Backend Docker (:3001) — no caching
   - `/ws/*` → **Custom origin (EC2)** → Nginx → Backend Docker (:3001) — WebSocket
   - Default (`*`) → **Custom origin (EC2)** → Nginx → Next.js standalone (:5001) — SSR pages
4. **Set alternate domain name** (CNAME): `alms.sparquer.com`
5. **Request SSL certificate** via ACM

### Step 4: Configure DNS

| Record | Type | Value |
|---|---|---|
| `alms.sparquer.com` | CNAME | CloudFront distribution domain |
| `api.alms.sparquer.com` (optional) | A | EC2 public IP (if using separate API domain) |

## Environment Variables

### `.env.prod` (for Backend Docker)

```env
DATABASE_URL=postgresql://user:password@host:5432/alms_prod
JWT_SECRET=your-production-jwt-secret
NODE_ENV=production
PORT=3001
```

### Frontend Build Variables

Set these before building:

```env
NEXT_PUBLIC_API_URL=https://alms.sparquer.com/api
BACKEND_URL=http://localhost:3001
```

## Nginx on EC2 (Optional)

If using the EC2 instance as the API origin for CloudFront, Nginx routes requests:

- `/api/*` → `localhost:3001` (Backend Docker container)
- `/ws/*` → `localhost:3001` (WebSocket)
- `/*` → `localhost:5001` (Frontend standalone server, if running on same EC2)

---

> **⚠️ Security Note:** The `deploy.ps1` script previously had hardcoded AWS credentials. These have been removed. Always use environment variables, AWS CLI profiles, or IAM instance roles for authentication.
