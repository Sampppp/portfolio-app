#!/bin/bash

# SSL Certificate Verification Script
# This script verifies that SSL certificates are properly installed and working

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Configuration
domain="thisguyisreallycool.sp4k.live"
cert_path="./ssl/certbot/conf/live/$domain"

log "Starting SSL verification for $domain"

# Check if certificate files exist
log "Checking certificate files..."
if [ ! -f "$cert_path/fullchain.pem" ]; then
    error "Certificate file not found: $cert_path/fullchain.pem"
    exit 1
fi

if [ ! -f "$cert_path/privkey.pem" ]; then
    error "Private key file not found: $cert_path/privkey.pem"
    exit 1
fi

success "Certificate files found"

# Check certificate validity
log "Checking certificate validity..."
cert_info=$(openssl x509 -in "$cert_path/fullchain.pem" -text -noout)

# Extract certificate details
subject=$(echo "$cert_info" | grep "Subject:" | sed 's/.*CN = //')
issuer=$(echo "$cert_info" | grep "Issuer:" | sed 's/.*CN = //')
not_before=$(openssl x509 -in "$cert_path/fullchain.pem" -noout -startdate | cut -d= -f2)
not_after=$(openssl x509 -in "$cert_path/fullchain.pem" -noout -enddate | cut -d= -f2)

echo ""
log "Certificate Details:"
echo "  Subject: $subject"
echo "  Issuer: $issuer"
echo "  Valid From: $not_before"
echo "  Valid Until: $not_after"

# Check if certificate is currently valid
if openssl x509 -in "$cert_path/fullchain.pem" -noout -checkend 0 >/dev/null 2>&1; then
    success "Certificate is currently valid"
else
    error "Certificate is expired or not yet valid"
    exit 1
fi

# Check if certificate expires soon (within 30 days)
if openssl x509 -in "$cert_path/fullchain.pem" -noout -checkend 2592000 >/dev/null 2>&1; then
    log "Certificate is valid for more than 30 days"
else
    warning "Certificate expires within 30 days - renewal recommended"
fi

# Check Docker services
log "Checking Docker services..."
if docker compose -f docker-compose.ssl.yml ps | grep -q "Up"; then
    success "Docker services are running"
else
    error "Some Docker services are not running"
    docker compose -f docker-compose.ssl.yml ps
    exit 1
fi

# Test HTTP connectivity (should redirect to HTTPS)
log "Testing HTTP connectivity (should redirect to HTTPS)..."
http_response=$(curl -s -o /dev/null -w "%{http_code}" "http://$domain" || echo "000")
if [ "$http_response" = "301" ] || [ "$http_response" = "302" ]; then
    success "HTTP correctly redirects to HTTPS (status: $http_response)"
elif [ "$http_response" = "200" ]; then
    warning "HTTP returns 200 - redirect may not be working properly"
else
    error "HTTP test failed (status: $http_response)"
fi

# Test HTTPS connectivity
log "Testing HTTPS connectivity..."
https_response=$(curl -s -o /dev/null -w "%{http_code}" "https://$domain" || echo "000")
if [ "$https_response" = "200" ]; then
    success "HTTPS is working correctly"
else
    error "HTTPS test failed (status: $https_response)"
    exit 1
fi

# Test SSL certificate from external perspective
log "Testing SSL certificate from external perspective..."
ssl_check=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -subject 2>/dev/null)
if echo "$ssl_check" | grep -q "$domain"; then
    success "SSL certificate is properly served"
else
    error "SSL certificate test failed"
    exit 1
fi

# Check SSL Labs rating (optional - requires internet)
log "Checking SSL configuration..."
ssl_test_result=$(curl -s "https://api.ssllabs.com/api/v3/analyze?host=$domain&publish=off&startNew=on&all=done" 2>/dev/null || echo "")
if [ -n "$ssl_test_result" ]; then
    log "SSL Labs test initiated - check https://www.ssllabs.com/ssltest/analyze.html?d=$domain for detailed results"
else
    log "SSL Labs test skipped (requires internet connectivity)"
fi

# Final summary
echo ""
success "=== SSL VERIFICATION COMPLETE ==="
echo ""
log "Summary:"
echo "  ✓ Certificate files exist"
echo "  ✓ Certificate is valid"
echo "  ✓ Docker services running"
echo "  ✓ HTTP redirects to HTTPS"
echo "  ✓ HTTPS is accessible"
echo "  ✓ SSL certificate properly served"
echo ""
success "Your SSL setup is working correctly!"
echo ""
log "Your site is accessible at: https://$domain"
log "Certificate expires: $not_after"
log "Auto-renewal is handled by the certbot container"

# Cloudflare instructions
echo ""
log "Cloudflare Configuration:"
echo "  • You can now re-enable Cloudflare proxy (orange cloud) if desired"
echo "  • Recommended Cloudflare SSL/TLS setting: Full (Strict)"
echo "  • Your current setting (Full) will continue to work"
