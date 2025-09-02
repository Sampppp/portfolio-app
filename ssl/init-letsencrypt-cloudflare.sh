#!/bin/bash

# Initialize Let's Encrypt certificates for Docker setup with Cloudflare compatibility
# This script handles the two-stage process: HTTP-only validation, then SSL setup

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check dependencies
if ! [ -x "$(command -v docker)" ]; then
  error 'docker is not installed.'
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  error 'docker compose is not available.'
  exit 1
fi

# Configuration
domains=(thisguyisreallycool.sp4k.live)
rsa_key_size=4096
data_path="./ssl/certbot"
email="samsonpak4@gmail.com"
staging=0 # Set to 1 if you're testing your setup to avoid hitting request limits

log "Starting Let's Encrypt certificate setup for: ${domains[*]}"

# Check if data exists
if [ -d "$data_path" ]; then
  warning "Existing certificate data found for ${domains[*]}"
  read -p "Continue and replace existing certificate? (y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    log "Setup cancelled by user"
    exit 0
  fi
  log "Cleaning up existing certificate data..."
  rm -rf "$data_path"
fi

# Download recommended TLS parameters
if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
  log "Downloading recommended TLS parameters..."
  mkdir -p "$data_path/conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
  success "TLS parameters downloaded"
fi

# Stop any existing containers
log "Stopping any existing containers..."
docker compose -f docker-compose.ssl.yml down 2>/dev/null || true

# STAGE 1: HTTP-only setup for certificate validation
log "=== STAGE 1: Starting HTTP-only nginx for certificate validation ==="

# Create temporary docker-compose file for HTTP-only stage
cat > docker-compose.http-only.yml << EOF
services:
  web:
    build: 
      context: ./api
    command: gunicorn portfolio.wsgi:application --bind 0.0.0.0:8000 --workers 3
    volumes:
      - static_volume:/app/staticfiles
      - media_volume:/app/media
      - ./logs:/app/logs
      - /mnt/nas/images:/mnt/nas/images
    environment:
      - DJANGO_SETTINGS_MODULE=portfolio.settings
    env_file:
      - .env.production
    depends_on:
      - db
      - redis

  nginx:
    build: 
      context: ./frontend
    ports:
      - "80:80"
    volumes:
      - static_volume:/app/staticfiles
      - media_volume:/app/media
      - ./ssl/certbot/www:/var/www/certbot
      - ./frontend/nginx/nginx-http-only.conf:/etc/nginx/conf.d/nginx.conf
    depends_on:
      - web

  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data/
    env_file:
      - .env.production

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  static_volume:
  media_volume:
  redis_data:
EOF

# Start HTTP-only services
log "Starting services with HTTP-only configuration..."
docker compose -f docker-compose.http-only.yml up -d

# Wait for nginx to be ready
log "Waiting for nginx to be ready..."
sleep 10

# Test HTTP connectivity
log "Testing HTTP connectivity..."
if curl -f -s "http://${domains[0]}" > /dev/null; then
    success "HTTP connectivity confirmed"
else
    error "HTTP connectivity test failed. Check your DNS and port forwarding."
    docker compose -f docker-compose.http-only.yml logs nginx
    exit 1
fi

# STAGE 2: Request Let's Encrypt certificate
log "=== STAGE 2: Requesting Let's Encrypt certificate ==="

# Prepare domain arguments
domain_args=""
for domain in "${domains[@]}"; do
  domain_args="$domain_args -d $domain"
done

# Select appropriate email arg
case "$email" in
  "") email_arg="--register-unsafely-without-email" ;;
  *) email_arg="--email $email" ;;
esac

# Enable staging mode if needed
staging_arg=""
if [ $staging != "0" ]; then 
    staging_arg="--staging"
    warning "Using Let's Encrypt staging environment"
fi

# Request certificate
log "Requesting certificate from Let's Encrypt..."
docker run --rm --name certbot \
  -v "$PWD/ssl/certbot/conf:/etc/letsencrypt" \
  -v "$PWD/ssl/certbot/www:/var/www/certbot" \
  certbot/certbot \
  certonly --webroot -w /var/www/certbot \
    $staging_arg \
    $email_arg \
    $domain_args \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --non-interactive \
    --force-renewal

# Check if certificate was created
if [ ! -f "$data_path/conf/live/${domains[0]}/fullchain.pem" ]; then
    error "Certificate generation failed!"
    log "Checking certbot logs..."
    docker run --rm -v "$PWD/ssl/certbot/conf:/etc/letsencrypt" certbot/certbot logs
    exit 1
fi

success "Certificate successfully obtained!"

# STAGE 3: Switch to SSL configuration
log "=== STAGE 3: Switching to SSL configuration ==="

# Stop HTTP-only services
log "Stopping HTTP-only services..."
docker compose -f docker-compose.http-only.yml down

# Start SSL services
log "Starting services with SSL configuration..."
docker compose -f docker-compose.ssl.yml up -d

# Wait for services to be ready
log "Waiting for SSL services to be ready..."
sleep 15

# Test HTTPS connectivity
log "Testing HTTPS connectivity..."
if curl -f -s "https://${domains[0]}" > /dev/null; then
    success "HTTPS connectivity confirmed!"
else
    warning "HTTPS test failed, checking nginx logs..."
    docker compose -f docker-compose.ssl.yml logs nginx
fi

# Clean up temporary file
rm -f docker-compose.http-only.yml

# Final status check
log "=== FINAL STATUS ==="
if docker compose -f docker-compose.ssl.yml ps | grep -q "Up"; then
    success "All services are running!"
    log "Certificate location: $data_path/conf/live/${domains[0]}/"
    log "Certificate expires: $(openssl x509 -enddate -noout -in "$data_path/conf/live/${domains[0]}/fullchain.pem" | cut -d= -f2)"
    
    echo ""
    success "SSL setup complete! Your site should now be accessible at:"
    echo "  https://${domains[0]}"
    echo ""
    log "Next steps:"
    echo "  1. Test your site at https://${domains[0]}"
    echo "  2. You can now re-enable Cloudflare proxy (orange cloud) if desired"
    echo "  3. Certificates will auto-renew via the certbot container"
else
    error "Some services failed to start. Check logs with:"
    echo "  docker compose -f docker-compose.ssl.yml logs"
fi
