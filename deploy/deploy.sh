#!/usr/bin/env bash
# ============================================================================
# ALMS — Comprehensive Deployment Script
# ============================================================================
# Usage:
#   ./deploy/deploy.sh [--flags]
#
# Flags:
#   --skip-s3           Skip S3/CloudFront frontend deployment
#   --skip-migrations   Skip Prisma database migrations
#   --docker-only       Only build & start backend Docker (skip frontend, S3)
#   --frontend-only     Only build & deploy frontend (skip backend, DB)
#   --no-build          Don't rebuild Docker images (just restart containers)
#   --prod-env FILE     Path to production env file (default: ./.env.prod)
#   --help              Show this help
# ============================================================================

set -euo pipefail

# ─── Colors ────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ─── Configuration ─────────────────────────────────────────────────────────
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Backend
BACKEND_COMPOSE_FILE="docker-compose.prod.yml"
BACKEND_CONTAINER="alms-backend-prod"
BACKEND_PORT=3001
BACKEND_HEALTH_URL="http://localhost:${BACKEND_PORT}/api/health/ready"

# Frontend
FRONTEND_DIR="${PROJECT_ROOT}/frontend"
FRONTEND_S3_BUCKET="alms-frontend-prod-bucket"
FRONTEND_CLOUDFRONT_ID=""               # Set to your CloudFront distribution ID
FRONTEND_AWS_REGION="ap-south-1"

# Prisma
PRISMA_DIR="${PROJECT_ROOT}/backend/prisma"

# EC2 standalone server (for deploying Next.js standalone server files)
EC2_HOST=""                              # e.g. "ubuntu@54.123.45.67"
EC2_FRONTEND_DIR="/home/alms/frontend"

# ─── Parse Flags ───────────────────────────────────────────────────────────
SKIP_S3=false
SKIP_MIGRATIONS=false
DOCKER_ONLY=false
FRONTEND_ONLY=false
NO_BUILD=false
ENV_FILE="${PROJECT_ROOT}/.env.prod"

usage() {
    sed -n 's/^# //p; s/^#//p' "$0"
    exit 0
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --skip-s3)           SKIP_S3=true; shift ;;
        --skip-migrations)   SKIP_MIGRATIONS=true; shift ;;
        --docker-only)       DOCKER_ONLY=true; shift ;;
        --frontend-only)     FRONTEND_ONLY=true; shift ;;
        --no-build)          NO_BUILD=true; shift ;;
        --prod-env)          ENV_FILE="$2"; shift 2 ;;
        --help)              usage ;;
        *)                   echo -e "${RED}Unknown flag: $1${NC}"; usage ;;
    esac
done

# ─── Helper Functions ──────────────────────────────────────────────────────
log_info()  { echo -e "${BLUE}[$(date '+%H:%M:%S')] [INFO]${NC}  $*"; }
log_ok()    { echo -e "${GREEN}[$(date '+%H:%M:%S')] [ OK ]${NC}  $*"; }
log_warn()  { echo -e "${YELLOW}[$(date '+%H:%M:%S')] [WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[$(date '+%H:%M:%S')] [FAIL]${NC}  $*"; }
log_step()  { echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo -e "${CYAN}  ▶ $1${NC}"; echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

# ─── Step 0: Prerequisites ─────────────────────────────────────────────────
check_prerequisites() {
    log_step "Step 0: Checking prerequisites"

    local missing=false

    if ! command -v docker &>/dev/null; then
        log_error "Docker is not installed. Install it: https://docs.docker.com/engine/install/"
        missing=true
    else
        log_ok "Docker: $(docker --version 2>/dev/null)"
    fi

    if ! docker compose version &>/dev/null && ! docker-compose --version &>/dev/null; then
        log_error "Docker Compose is not installed."
        missing=true
    else
        log_ok "Docker Compose: $(docker compose version 2>/dev/null || docker-compose --version 2>/dev/null)"
    fi

    if ! command -v node &>/dev/null; then
        log_error "Node.js is not installed."
        missing=true
    else
        log_ok "Node.js: $(node --version)"
    fi

    if ! command -v npm &>/dev/null; then
        log_error "npm is not installed."
        missing=true
    else
        log_ok "npm: $(npm --version)"
    fi

    if ! command -v npx &>/dev/null; then
        log_error "npx is not installed."
        missing=true
    fi

    # AWS CLI (only needed for S3 upload)
    if [[ "$SKIP_S3" == false && "$FRONTEND_ONLY" == false ]]; then
        if command -v aws &>/dev/null; then
            log_ok "AWS CLI: $(aws --version 2>&1 | head -1)"
            # Check if AWS credentials are configured
            if ! aws sts get-caller-identity &>/dev/null; then
                log_warn "AWS CLI found but no credentials configured. S3 upload will fail."
                log_warn "Configure with: aws configure or set AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY"
            fi
        else
            log_warn "AWS CLI not found. Set --skip-s3 or install AWS CLI."
            log_warn "Install: https://aws.amazon.com/cli/"
        fi
    fi

    # Check env file
    if [[ ! -f "$ENV_FILE" ]]; then
        log_warn "Production env file not found: $ENV_FILE"
        log_warn "Create it with required variables: DATABASE_URL, JWT_SECRET, NEXT_PUBLIC_API_URL"
        log_warn "Continuing without env file (may use defaults or fail)..."
    else
        log_ok "Env file found: $ENV_FILE"
    fi

    if [[ "$missing" == true ]]; then
        log_error "Prerequisites check failed. Aborting."
        exit 1
    fi

    log_ok "All prerequisites satisfied."
}

# ─── Step 1: Prisma Migrations ─────────────────────────────────────────────
run_migrations() {
    if [[ "$SKIP_MIGRATIONS" == true || "$FRONTEND_ONLY" == true ]]; then
        log_info "Skipping Prisma migrations."
        return
    fi

    log_step "Step 1: Database — Prisma Migrations"

    cd "${PROJECT_ROOT}/backend"

    if [[ ! -d "$PRISMA_DIR" ]]; then
        log_error "Prisma directory not found: $PRISMA_DIR"
        return 1
    fi

    log_info "Generating Prisma client..."
    if npx prisma generate; then
        log_ok "Prisma client generated."
    else
        log_error "Failed to generate Prisma client."
        return 1
    fi

    log_info "Running pending migrations..."
    if npx prisma migrate deploy; then
        log_ok "All migrations applied successfully."
    else
        log_error "Migration deploy failed. Check DATABASE_URL in env file."
        log_error "Common causes: DB not reachable, wrong credentials, RDS security group."
        return 1
    fi

    cd "$PROJECT_ROOT"
}

# ─── Step 2: Backend Docker Build & Deploy ─────────────────────────────────
deploy_backend() {
    if [[ "$FRONTEND_ONLY" == true ]]; then
        log_info "Skipping backend deployment (--frontend-only)."
        return
    fi

    log_step "Step 2: Backend — Docker Build & Deploy"

    cd "$PROJECT_ROOT"

    if [[ ! -f "$BACKEND_COMPOSE_FILE" ]]; then
        log_error "Production compose file not found: $BACKEND_COMPOSE_FILE"
        return 1
    fi

    if [[ "$NO_BUILD" == true ]]; then
        log_info "Starting containers without rebuild (--no-build)..."
        docker compose -f "$BACKEND_COMPOSE_FILE" up -d
    else
        log_info "Building Docker image and starting containers..."
        docker compose -f "$BACKEND_COMPOSE_FILE" up -d --build
    fi

    # Wait for health check
    log_info "Waiting for backend health check (this may take 2+ minutes)..."
    local max_retries=30
    local retry=0
    while [[ $retry -lt $max_retries ]]; do
        sleep 10
        if curl -sf "$BACKEND_HEALTH_URL" &>/dev/null; then
            log_ok "Backend health check passed."
            break
        fi
        retry=$((retry + 1))
        if [[ $retry -eq $max_retries ]]; then
            log_warn "Backend health check did not pass within timeout."
            log_warn "Check logs: docker compose -f $BACKEND_COMPOSE_FILE logs --tail=50"
        fi
    done

    cd "$PROJECT_ROOT"
    log_ok "Backend deployment complete."
}

# ─── Step 3: Frontend Build ────────────────────────────────────────────────
build_frontend() {
    if [[ "$DOCKER_ONLY" == true ]]; then
        log_info "Skipping frontend build (--docker-only)."
        return
    fi

    log_step "Step 3: Frontend — Build"

    cd "$FRONTEND_DIR"

    log_info "Installing dependencies..."
    if npm install --no-audit --no-fund; then
        log_ok "Dependencies installed."
    else
        log_error "npm install failed."
        return 1
    fi

    log_info "Building Next.js app (output: standalone)..."
    if npm run build; then
        log_ok "Frontend build completed."
    else
        log_error "Build failed. Check errors above."
        return 1
    fi

    # Validate build output
    local static_dir="${FRONTEND_DIR}/.next/static"
    local standalone_dir="${FRONTEND_DIR}/.next/standalone"

    if [[ ! -d "$static_dir" ]]; then
        log_error "Build output missing: .next/static"
        return 1
    fi
    if [[ ! -d "$standalone_dir" ]]; then
        log_error "Build output missing: .next/standalone"
        return 1
    fi
    log_ok "Build artifacts validated."

    cd "$PROJECT_ROOT"
}

# ─── Step 4: Deploy Frontend to S3 + CloudFront ────────────────────────────
deploy_frontend_s3() {
    if [[ "$SKIP_S3" == true || "$DOCKER_ONLY" == true ]]; then
        log_info "Skipping S3/CloudFront deployment."
        return
    fi

    log_step "Step 4: Frontend — S3 & CloudFront Deploy"

    if ! command -v aws &>/dev/null; then
        log_warn "AWS CLI not available. Skipping S3 upload."
        return
    fi

    local static_dir="${FRONTEND_DIR}/.next/static"
    local public_dir="${FRONTEND_DIR}/public"

    # Ensure S3 bucket exists
    log_info "Checking S3 bucket: ${FRONTEND_S3_BUCKET}..."
    if ! aws s3api head-bucket --bucket "$FRONTEND_S3_BUCKET" --region "$FRONTEND_AWS_REGION" 2>/dev/null; then
        log_warn "Bucket does not exist. Creating..."
        if [[ "$FRONTEND_AWS_REGION" == "us-east-1" ]]; then
            aws s3api create-bucket --bucket "$FRONTEND_S3_BUCKET" --region "$FRONTEND_AWS_REGION"
        else
            aws s3api create-bucket --bucket "$FRONTEND_S3_BUCKET" --region "$FRONTEND_AWS_REGION" \
                --create-bucket-configuration "LocationConstraint=${FRONTEND_AWS_REGION}"
        fi
        aws s3api put-public-access-block --bucket "$FRONTEND_S3_BUCKET" \
            --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
        log_ok "Bucket created and secured."
    else
        log_ok "Bucket exists."
    fi

    # Upload static assets
    log_info "Uploading static assets to S3..."
    if aws s3 sync "$static_dir" "s3://${FRONTEND_S3_BUCKET}/_next/static/" \
        --delete --region "$FRONTEND_AWS_REGION" --only-show-errors; then
        log_ok "Static assets uploaded."
    else
        log_error "Static assets upload failed."
        return 1
    fi

    # Upload public assets
    if [[ -d "$public_dir" ]]; then
        log_info "Uploading public assets to S3..."
        if aws s3 sync "$public_dir" "s3://${FRONTEND_S3_BUCKET}/" \
            --delete --region "$FRONTEND_AWS_REGION" --exclude ".gitkeep" --only-show-errors; then
            log_ok "Public assets uploaded."
        else
            log_warn "Public assets upload had issues."
        fi
    fi

    # CloudFront invalidation
    if [[ -n "$FRONTEND_CLOUDFRONT_ID" ]]; then
        log_info "Invalidating CloudFront cache..."
        if aws cloudfront create-invalidation \
            --distribution-id "$FRONTEND_CLOUDFRONT_ID" \
            --paths "/*" \
            --region "$FRONTEND_AWS_REGION" &>/dev/null; then
            log_ok "CloudFront cache invalidation initiated."
        else
            log_warn "CloudFront invalidation failed. Check distribution ID."
        fi
    else
        log_info "No CloudFront distribution ID set. Skipping cache invalidation."
    fi

    # Deploy standalone server to EC2 (optional)
    if [[ -n "$EC2_HOST" ]]; then
        log_info "Copying standalone server to EC2: ${EC2_HOST}..."
        local standalone_dir="${FRONTEND_DIR}/.next/standalone"

        # rsync or scp the standalone server to EC2
        if command -v rsync &>/dev/null; then
            rsync -avz --delete \
                "${standalone_dir}/" \
                "${EC2_HOST}:${EC2_FRONTEND_DIR}/" \
                --exclude "node_modules"
            rsync -avz "${FRONTEND_DIR}/package.json" "${EC2_HOST}:${EC2_FRONTEND_DIR}/"
            log_ok "Standalone server synced to EC2."
        else
            log_warn "rsync not found. Install it or manually copy files:"
            log_warn "  scp -r ${standalone_dir}/* ${EC2_HOST}:${EC2_FRONTEND_DIR}/"
            log_warn "  scp ${FRONTEND_DIR}/package.json ${EC2_HOST}:${EC2_FRONTEND_DIR}/"
        fi
    fi
}

# ─── Step 5: Verification ──────────────────────────────────────────────────
verify_deployment() {
    log_step "Step 5: Verification"

    local all_good=true

    # Backend health check
    if [[ "$FRONTEND_ONLY" == false ]]; then
        log_info "Checking backend API..."
        if curl -sf "$BACKEND_HEALTH_URL" &>/dev/null; then
            log_ok "Backend API: ✅  (${BACKEND_HEALTH_URL})"
        else
            log_error "Backend API: ❌  Not responding at ${BACKEND_HEALTH_URL}"
            all_good=false
        fi

        log_info "Checking backend container status..."
        if docker ps --format '{{.Names}} {{.Status}}' | grep -q "${BACKEND_CONTAINER}.*Up"; then
            log_ok "Backend container: ✅  Running"
        else
            log_error "Backend container: ❌  Not running or unhealthy"
            log_info "Run: docker compose -f ${BACKEND_COMPOSE_FILE} ps"
            all_good=false
        fi
    fi

    # S3 deployment check
    if [[ "$SKIP_S3" == false && "$DOCKER_ONLY" == false ]] && command -v aws &>/dev/null; then
        log_info "Checking S3 bucket contents..."
        if aws s3 ls "s3://${FRONTEND_S3_BUCKET}/_next/static/" --region "$FRONTEND_AWS_REGION" &>/dev/null; then
            log_ok "S3 static assets: ✅  Present"
        else
            log_warn "S3 static assets: ⚠️  Could not list"
        fi
    fi

    if [[ "$all_good" == true ]]; then
        echo ""
        log_ok "✓ Deployment verification passed!"
    else
        echo ""
        log_warn "⚠️  Some checks failed. See messages above."
    fi
}

# ─── Summary ───────────────────────────────────────────────────────────────
print_summary() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}            ALMS Deployment Summary                        ${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  Timestamp:  $(date '+%Y-%m-%d %H:%M:%S')"
    echo -e "  Project:    ${PROJECT_ROOT}"
    echo ""
    echo -e "  ${GREEN}✓${NC} Backend:      http://localhost:${BACKEND_PORT}"
    echo -e "  ${GREEN}✓${NC} Health:       ${BACKEND_HEALTH_URL}"
    echo ""
    if [[ "$SKIP_S3" == false && "$DOCKER_ONLY" == false ]]; then
        echo -e "  ${GREEN}✓${NC} S3 Bucket:    s3://${FRONTEND_S3_BUCKET}/"
        echo -e "  ${GREEN}✓${NC} CloudFront:   ${FRONTEND_CLOUDFRONT_ID:-Not configured}"
    fi
    echo ""
    echo -e "  ${CYAN}Management Commands:${NC}"
    echo -e "    Logs:        docker compose -f ${BACKEND_COMPOSE_FILE} logs -f"
    echo -e "    Stop:        docker compose -f ${BACKEND_COMPOSE_FILE} down"
    echo -e "    Restart:     docker compose -f ${BACKEND_COMPOSE_FILE} restart"
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
}

# ─── Main ──────────────────────────────────────────────────────────────────
main() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║       ALMS  —  Production Deployment Pipeline           ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""

    check_prerequisites

    if [[ "$FRONTEND_ONLY" == true ]]; then
        build_frontend
        deploy_frontend_s3
        print_summary
        exit 0
    fi

    if [[ "$DOCKER_ONLY" == true ]]; then
        deploy_backend
        verify_deployment
        print_summary
        exit 0
    fi

    # Full deployment pipeline
    run_migrations
    deploy_backend
    build_frontend
    deploy_frontend_s3
    verify_deployment
    print_summary

    echo ""
    log_ok "Deployment complete!"
}

main "$@"
