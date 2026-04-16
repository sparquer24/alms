#!/bin/bash

# Quick Start Script for ALMS Unified Docker Setup
# This script helps users get started quickly with the unified configuration

set -e

echo "🚀 ALMS Unified Docker Quick Start"
echo "=================================="

# Check if Docker and Docker Compose are available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose found"

# Check if unified compose file exists
if [ ! -f "docker-compose.unified.yml" ]; then
    echo "❌ docker-compose.unified.yml not found. Are you in the correct directory?"
    exit 1
fi

echo "✅ Unified compose file found"

# Check SSL certificates
echo ""
echo "🔍 Checking SSL certificates..."
ssl_ready=true

for env in dev prod fallback; do
    if [ ! -f "ssl/$env/fullchain.pem" ] || [ ! -f "ssl/$env/privkey.pem" ]; then
        ssl_ready=false
        break
    fi
done

if [ "$ssl_ready" = false ]; then
    echo "⚠️  SSL certificates not found. Setting up placeholder certificates..."
    
    # Create directories
    mkdir -p ssl/{dev,prod,fallback}
    
    # Create placeholder certificates using OpenSSL if available
    if command -v openssl &> /dev/null; then
        for env in dev prod fallback; do
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                -keyout "ssl/$env/privkey.pem" \
                -out "ssl/$env/fullchain.pem" \
                -subj "/C=US/ST=State/L=City/O=ALMS/CN=localhost" \
                -addext "subjectAltName=DNS:localhost,DNS:*.alms.sparquer.com" 2>/dev/null
            echo "✅ Created self-signed certificate for $env"
        done
    else
        echo "📝 Creating placeholder certificate files..."
        for env in dev prod fallback; do
            echo "# Placeholder certificate for $env" > "ssl/$env/fullchain.pem"
            echo "# Placeholder key for $env" > "ssl/$env/privkey.pem"
        done
        echo "⚠️  OpenSSL not found. Created placeholder files."
        echo "   Run ./setup-ssl-certificates.sh for proper certificates."
    fi
else
    echo "✅ SSL certificates found"
fi

# Stop any existing containers that might conflict
echo ""
echo "🧹 Cleaning up existing containers..."
docker-compose -f docker-compose.yml down 2>/dev/null || true
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
docker-compose -f docker-compose.unified.yml down 2>/dev/null || true

# Check for port conflicts
echo ""
echo "🔍 Checking for port conflicts..."
if netstat -ln 2>/dev/null | grep -q ":80 " || netstat -ln 2>/dev/null | grep -q ":443 "; then
    echo "⚠️  Ports 80 or 443 are already in use. You may need to stop other web servers."
    echo "   Common commands:"
    echo "   sudo systemctl stop apache2"
    echo "   sudo systemctl stop nginx"
    echo ""
    read -p "Continue anyway? (y/n): " continue_anyway
    if [ "$continue_anyway" != "y" ] && [ "$continue_anyway" != "Y" ]; then
        echo "❌ Cancelled by user"
        exit 1
    fi
fi

# Start the unified environment
echo ""
echo "🐳 Starting ALMS unified environment..."
echo "This may take a few minutes on first run (building images)..."

docker-compose -f docker-compose.unified.yml up -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Check service status
echo ""
echo "🔍 Service Status:"
docker-compose -f docker-compose.unified.yml ps

# Check if nginx is responding
echo ""
echo "🌐 Testing connectivity..."
if curl -s -k https://localhost >/dev/null 2>&1; then
    echo "✅ HTTPS is responding"
elif curl -s http://localhost >/dev/null 2>&1; then
    echo "✅ HTTP is responding"  
else
    echo "⚠️  Services may still be starting up..."
fi

echo ""
echo "🎉 ALMS Unified Setup Complete!"
echo ""
echo "📍 Access URLs:"
echo "   Development:  https://dev.alms.sparquer.com"
echo "   Production:   https://alms.sparquer.com"
echo ""
echo "🛠️  Management Commands:"
echo "   View logs:    docker-compose -f docker-compose.unified.yml logs -f"
echo "   Stop all:     docker-compose -f docker-compose.unified.yml down"
echo "   Restart:      docker-compose -f docker-compose.unified.yml restart"
echo ""
echo "📚 For detailed documentation, see: DOCKER-UNIFIED-SETUP.md"
echo ""
echo "⚠️  Note: If using self-signed certificates, browsers will show security warnings."
echo "   Click 'Advanced' → 'Proceed to site' to continue."
echo ""
echo "🔧 For production SSL certificates, run: ./setup-ssl-certificates.sh"