#!/bin/bash

# SSL Setup Script for Unified ALMS Docker Configuration
# This script helps set up SSL certificates for both dev and production environments

set -e

echo "🔒 ALMS SSL Certificate Setup"
echo "=============================="

# Check if running as root (needed for Let's Encrypt)
if [[ $EUID -eq 0 ]]; then
   echo "✅ Running as root - can manage Let's Encrypt certificates"
   ROOT_ACCESS=true
else
   echo "⚠️  Not running as root - will create self-signed certificates only"
   ROOT_ACCESS=false
fi

# Create SSL directories if they don't exist
mkdir -p ssl/dev ssl/prod ssl/fallback

echo ""
echo "🏗️  Setting up certificate directories..."

# Function to create self-signed certificate
create_self_signed() {
    local domain=$1
    local cert_dir=$2
    local env=$3
    
    echo "📝 Creating self-signed certificate for $domain ($env)"
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$cert_dir/privkey.pem" \
        -out "$cert_dir/fullchain.pem" \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=$domain" \
        -addext "subjectAltName=DNS:$domain,DNS:www.$domain"
    
    chmod 644 "$cert_dir/fullchain.pem"
    chmod 600 "$cert_dir/privkey.pem"
    
    echo "✅ Self-signed certificate created for $domain"
}

# Function to setup Let's Encrypt certificate
setup_letsencrypt() {
    local domain=$1
    local cert_dir=$2
    local env=$3
    
    echo "🌐 Setting up Let's Encrypt certificate for $domain ($env)"
    
    # Install certbot if not present
    if ! command -v certbot &> /dev/null; then
        echo "📦 Installing certbot..."
        apt-get update
        apt-get install -y certbot
    fi
    
    # Request certificate
    certbot certonly --standalone \
        --email admin@sparquer.com \
        --agree-tos \
        --no-eff-email \
        -d "$domain" \
        --cert-name "$env-$domain"
    
    # Copy certificates to our SSL directory
    cp "/etc/letsencrypt/live/$env-$domain/fullchain.pem" "$cert_dir/fullchain.pem"
    cp "/etc/letsencrypt/live/$env-$domain/privkey.pem" "$cert_dir/privkey.pem"
    
    # Set proper permissions
    chmod 644 "$cert_dir/fullchain.pem"
    chmod 600 "$cert_dir/privkey.pem"
    
    echo "✅ Let's Encrypt certificate configured for $domain"
}

echo ""
echo "🔧 Certificate Setup Options:"
echo "1) Self-signed certificates (development/testing)"
echo "2) Let's Encrypt certificates (production-ready)"
echo "3) Use existing certificates"
echo ""

read -p "Choose option (1-3): " cert_option

case $cert_option in
    1)
        echo "📋 Creating self-signed certificates..."
        create_self_signed "dev.alms.sparquer.com" "ssl/dev" "dev"
        create_self_signed "alms.sparquer.com" "ssl/prod" "prod"
        create_self_signed "localhost" "ssl/fallback" "fallback"
        ;;
    2)
        if [ "$ROOT_ACCESS" = false ]; then
            echo "❌ Let's Encrypt requires root access. Please run as root or use option 1."
            exit 1
        fi
        
        echo "🌐 Setting up Let's Encrypt certificates..."
        echo "⚠️  Make sure your domains point to this server first!"
        read -p "Continue? (y/n): " continue_le
        
        if [ "$continue_le" = "y" ] || [ "$continue_le" = "Y" ]; then
            setup_letsencrypt "dev.alms.sparquer.com" "ssl/dev" "dev"
            setup_letsencrypt "alms.sparquer.com" "ssl/prod" "prod"
            create_self_signed "localhost" "ssl/fallback" "fallback"
        else
            echo "❌ Cancelled Let's Encrypt setup"
            exit 1
        fi
        ;;
    3)
        echo "📁 Using existing certificates..."
        echo "ℹ️  Make sure you have certificates in:"
        echo "   - ssl/dev/fullchain.pem & ssl/dev/privkey.pem"
        echo "   - ssl/prod/fullchain.pem & ssl/prod/privkey.pem"
        echo "   - ssl/fallback/fullchain.pem & ssl/fallback/privkey.pem"
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "🔍 Certificate Status:"
for env in dev prod fallback; do
    if [ -f "ssl/$env/fullchain.pem" ] && [ -f "ssl/$env/privkey.pem" ]; then
        echo "✅ $env: Certificates present"
        echo "   Cert: ssl/$env/fullchain.pem"
        echo "   Key:  ssl/$env/privkey.pem"
    else
        echo "❌ $env: Missing certificates"
    fi
done

echo ""
echo "🚀 Next Steps:"
echo "1. Run the unified setup: docker-compose -f docker-compose.unified.yml up -d"
echo "2. Access your applications:"
echo "   - Development: https://dev.alms.sparquer.com"
echo "   - Production:  https://alms.sparquer.com"
echo ""
echo "📝 For certificate renewal (Let's Encrypt):"
echo "   sudo certbot renew --deploy-hook './setup-ssl-certificates.sh'"
echo ""
echo "🔒 SSL setup completed!"