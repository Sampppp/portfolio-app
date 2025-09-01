# Production Deployment Guide

This guide provides step-by-step instructions for deploying the Portfolio App to production, including all necessary configuration changes, security considerations, and performance optimizations.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Security Settings](#security-settings)
4. [Database Configuration](#database-configuration)
5. [Static Files and Media](#static-files-and-media)
6. [Performance Optimizations](#performance-optimizations)
7. [Docker Production Setup](#docker-production-setup)
8. [Web Server Configuration](#web-server-configuration)
9. [SSL/TLS Setup](#ssltls-setup)
10. [Monitoring and Logging](#monitoring-and-logging)
11. [Deployment Checklist](#deployment-checklist)
12. [Post-Deployment Verification](#post-deployment-verification)

## Pre-Deployment Checklist

### Development vs Production Differences
- [ ] Debug mode disabled
- [ ] Secret key changed to production value
- [ ] Allowed hosts restricted to production domains
- [ ] Database configured for production
- [ ] Static files configured for production serving
- [ ] CORS settings restricted
- [ ] Logging configured for production
- [ ] Performance optimizations enabled

### Required Information
- [ ] Production domain name(s)
- [ ] Database credentials and connection details
- [ ] SSL certificate information
- [ ] Email configuration (if needed)
- [ ] Third-party service credentials

## Environment Configuration

### 1. Create Production Environment File

Create `.env.production` file:

```bash
# Database Configuration
POSTGRES_DB=portfolio_prod
POSTGRES_USER=portfolio_user
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_HOST=your_db_host
POSTGRES_PORT=5432

# Django Configuration
DEBUG=False
SECRET_KEY=your_very_secure_secret_key_here
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Media and Static Files
PHOTOS_PATH=/app/media/photos
STATIC_ROOT=/app/staticfiles
MEDIA_ROOT=/app/media

# Security Settings
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True
SECURE_CONTENT_TYPE_NOSNIFF=True
SECURE_BROWSER_XSS_FILTER=True
X_FRAME_OPTIONS=DENY

# Email Configuration (if needed)
EMAIL_HOST=smtp.yourdomain.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=noreply@yourdomain.com
EMAIL_HOST_PASSWORD=your_email_password
```

### 2. Update Django Settings

Create `api/portfolio/settings_production.py`:

```python
from .settings import *
import os

# Security Settings
DEBUG = False
SECRET_KEY = os.environ.get('SECRET_KEY')
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')

# Database Configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('POSTGRES_DB'),
        'USER': os.environ.get('POSTGRES_USER'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD'),
        'HOST': os.environ.get('POSTGRES_HOST'),
        'PORT': os.environ.get('POSTGRES_PORT', '5432'),
        'OPTIONS': {
            'sslmode': 'require',
        },
        'CONN_MAX_AGE': 60,
    }
}

# Static Files Configuration
STATIC_URL = '/static/'
STATIC_ROOT = os.environ.get('STATIC_ROOT', '/app/staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media Files Configuration
MEDIA_URL = '/media/'
MEDIA_ROOT = os.environ.get('MEDIA_ROOT', '/app/media')

# Security Settings
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# CORS Configuration
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
]
CORS_ALLOW_CREDENTIALS = True

# Session Security
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Strict'
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Strict'

# Logging Configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/app/logs/django.log',
            'maxBytes': 1024*1024*15,  # 15MB
            'backupCount': 10,
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'photos': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Cache Configuration
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://redis:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'KEY_PREFIX': 'portfolio',
        'TIMEOUT': 300,
    }
}

# Email Configuration
if os.environ.get('EMAIL_HOST'):
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = os.environ.get('EMAIL_HOST')
    EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
    EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True').lower() == 'true'
    EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
    EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')
    DEFAULT_FROM_EMAIL = os.environ.get('EMAIL_HOST_USER')
```

## Security Settings

### 1. Generate Secure Secret Key

```python
# Generate a new secret key
import secrets
secret_key = secrets.token_urlsafe(50)
print(f"SECRET_KEY={secret_key}")
```

### 2. Update Requirements for Production

Add to `api/requirements.txt`:

```txt
# Production dependencies
gunicorn==21.2.0
whitenoise==6.6.0
psycopg2-binary==2.9.9
redis==5.0.1
django-redis==5.4.0
sentry-sdk[django]==1.40.0  # Optional: Error tracking
```

### 3. Security Headers Middleware

Add to `api/portfolio/middleware.py`:

```python
class SecurityHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        
        return response
```

Add to middleware in settings:

```python
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'portfolio.middleware.SecurityHeadersMiddleware',  # Add this
    # ... rest of middleware
]
```

## Database Configuration

### 1. Production Database Setup

```sql
-- Create production database and user
CREATE DATABASE portfolio_prod;
CREATE USER portfolio_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE portfolio_prod TO portfolio_user;
ALTER USER portfolio_user CREATEDB;  -- For running tests if needed
```

### 2. Database Migration

```bash
# Set production environment
export DJANGO_SETTINGS_MODULE=portfolio.settings_production

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput

# Scan photos (if photos directory exists)
python manage.py scan_photos
```

## Static Files and Media

### 1. Static Files Configuration

Update `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  web:
    build: 
      context: ./api
      dockerfile: Dockerfile.prod
    command: gunicorn portfolio.wsgi:application --bind 0.0.0.0:8000 --workers 3
    volumes:
      - static_volume:/app/staticfiles
      - media_volume:/app/media
      - ./logs:/app/logs
    environment:
      - DJANGO_SETTINGS_MODULE=portfolio.settings_production
    env_file:
      - .env.production
    depends_on:
      - db
      - redis

  nginx:
    build: ./nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - static_volume:/app/staticfiles
      - media_volume:/app/media
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - web

  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data/
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
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
```

### 2. Create Production Dockerfile

Create `api/Dockerfile.prod`:

```dockerfile
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . /app/

# Create directories
RUN mkdir -p /app/staticfiles /app/media /app/logs

# Collect static files
RUN python manage.py collectstatic --noinput --settings=portfolio.settings_production

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser
RUN chown -R appuser:appuser /app
USER appuser

# Run gunicorn
CMD ["gunicorn", "portfolio.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
```

## Performance Optimizations

### 1. Frontend Optimizations

Create `frontend/build.sh`:

```bash
#!/bin/bash

# Frontend production build script
echo "Building frontend for production..."

# Minify CSS
npx clean-css-cli -o src/style.min.css src/style.css

# Minify JavaScript
npx terser src/script.js -o src/script.min.js --compress --mangle

# Generate WebP images (if imagemagick is available)
if command -v convert &> /dev/null; then
    echo "Converting images to WebP..."
    find ../images -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" | while read img; do
        webp_name="${img%.*}.webp"
        if [ ! -f "$webp_name" ]; then
            convert "$img" -quality 85 "$webp_name"
            echo "Created: $webp_name"
        fi
    done
fi

# Update HTML to use minified files
sed -i 's/style\.css/style.min.css/g' src/index.html
sed -i 's/script\.js/script.min.js/g' src/index.html

echo "Frontend build complete!"
```

### 2. Update Service Worker for Production

Update `frontend/src/sw.js`:

```javascript
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAMES = {
  static: `portfolio-static-${CACHE_VERSION}`,
  images: `portfolio-images-${CACHE_VERSION}`,
  api: `portfolio-api-${CACHE_VERSION}`
};

// Production cache strategies
const CACHE_STRATEGIES = {
  static: 'cache-first',
  images: 'cache-first',
  api: 'network-first'
};

// Cache durations (in seconds)
const CACHE_DURATIONS = {
  static: 31536000,  // 1 year
  images: 2592000,   // 30 days
  api: 300           // 5 minutes
};

// Add production-specific caching logic
self.addEventListener('fetch', event => {
  // Handle different resource types with appropriate strategies
  if (event.request.url.includes('/static/')) {
    event.respondWith(cacheFirst(event.request, CACHE_NAMES.static));
  } else if (event.request.url.includes('/media/')) {
    event.respondWith(cacheFirst(event.request, CACHE_NAMES.images));
  } else if (event.request.url.includes('/api/')) {
    event.respondWith(networkFirst(event.request, CACHE_NAMES.api));
  }
});
```

## Web Server Configuration

### 1. Nginx Configuration

Create `nginx/nginx.conf`:

```nginx
upstream portfolio_app {
    server web:8000;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        image/svg+xml;

    # Static files
    location /static/ {
        alias /app/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        
        # Brotli compression (if available)
        location ~* \.(css|js)$ {
            add_header Cache-Control "public, immutable";
            expires 1y;
        }
    }

    # Media files
    location /media/ {
        alias /app/media/;
        expires 30d;
        add_header Cache-Control "public";
        
        # WebP support
        location ~* \.(jpg|jpeg|png)$ {
            add_header Vary Accept;
            try_files $uri$webp_suffix $uri =404;
        }
    }

    # API and admin
    location / {
        proxy_pass http://portfolio_app;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
        proxy_redirect off;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Frontend files
    location /frontend/ {
        alias /app/frontend/src/;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### 2. Create Nginx Dockerfile

Create `nginx/Dockerfile`:

```dockerfile
FROM nginx:alpine

# Remove default nginx website
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/

# Create directories
RUN mkdir -p /etc/nginx/ssl

# Copy SSL certificates (you'll need to provide these)
# COPY cert.pem /etc/nginx/ssl/
# COPY key.pem /etc/nginx/ssl/
```

## SSL/TLS Setup

### 1. Using Let's Encrypt (Recommended)

Create `ssl/setup-ssl.sh`:

```bash
#!/bin/bash

# Install certbot
apt-get update
apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Set up auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

### 2. Manual SSL Certificate

If using custom SSL certificates:

```bash
# Copy your certificates
cp your-cert.pem ssl/cert.pem
cp your-key.pem ssl/key.pem

# Set proper permissions
chmod 600 ssl/key.pem
chmod 644 ssl/cert.pem
```

## Monitoring and Logging

### 1. Add Sentry for Error Tracking

Add to `settings_production.py`:

```python
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

sentry_sdk.init(
    dsn="your-sentry-dsn-here",
    integrations=[DjangoIntegration()],
    traces_sample_rate=0.1,
    send_default_pii=True
)
```

### 2. Health Check Endpoint

Create `api/portfolio/health.py`:

```python
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
import redis

def health_check(request):
    """Health check endpoint for monitoring"""
    status = {
        'status': 'healthy',
        'database': 'unknown',
        'cache': 'unknown'
    }
    
    # Check database
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        status['database'] = 'healthy'
    except Exception as e:
        status['database'] = 'unhealthy'
        status['status'] = 'unhealthy'
    
    # Check cache
    try:
        cache.set('health_check', 'ok', 30)
        if cache.get('health_check') == 'ok':
            status['cache'] = 'healthy'
        else:
            status['cache'] = 'unhealthy'
    except Exception as e:
        status['cache'] = 'unhealthy'
    
    return JsonResponse(status)
```

Add to `urls.py`:

```python
from .health import health_check

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('photos.urls')),
    path('health/', health_check),
    # ... rest of patterns
]
```

## Deployment Checklist

### Pre-Deployment
- [ ] All environment variables set in `.env.production`
- [ ] Database created and configured
- [ ] SSL certificates obtained and configured
- [ ] Static files directory created with proper permissions
- [ ] Media files directory created with proper permissions
- [ ] Log directory created with proper permissions
- [ ] Frontend assets minified and optimized
- [ ] WebP images generated

### Deployment Steps
- [ ] Build production Docker images
- [ ] Run database migrations
- [ ] Collect static files
- [ ] Create superuser account
- [ ] Start production services
- [ ] Configure nginx and SSL
- [ ] Set up monitoring and logging
- [ ] Configure backups

### Security Checklist
- [ ] Debug mode disabled
- [ ] Secret key changed
- [ ] Allowed hosts restricted
- [ ] CORS origins restricted
- [ ] SSL/HTTPS enabled
- [ ] Security headers configured
- [ ] Database credentials secured
- [ ] File permissions set correctly

## Post-Deployment Verification

### 1. Automated Tests

Create `scripts/production-test.sh`:

```bash
#!/bin/bash

DOMAIN="https://yourdomain.com"

echo "Testing production deployment..."

# Test API endpoints
echo "Testing API health..."
curl -f "$DOMAIN/health/" || exit 1

echo "Testing photos API..."
curl -f "$DOMAIN/api/photos/" || exit 1

echo "Testing static files..."
curl -f "$DOMAIN/static/admin/css/base.css" || exit 1

echo "Testing SSL..."
curl -I "$DOMAIN" | grep "HTTP/2 200" || exit 1

echo "All tests passed!"
```

### 2. Performance Testing

```bash
# Test with Lighthouse
npx lighthouse https://yourdomain.com --output=json --output-path=./lighthouse-report.json

# Test with curl
curl -w "@curl-format.txt" -o /dev/null -s "https://yourdomain.com"
```

Create `curl-format.txt`:

```
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
```

### 3. Monitoring Setup

```bash
# Set up log rotation
echo "/app/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 appuser appuser
}" > /etc/logrotate.d/portfolio

# Set up monitoring cron jobs
echo "*/5 * * * * curl -f https://yourdomain.com/health/ || echo 'Health check failed'" | crontab -
```

## Backup Strategy

### 1. Database Backup

Create `scripts/backup-db.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/portfolio_backup_$DATE.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Keep only last 30 days of backups
find $BACKUP_DIR -name "portfolio_backup_*.sql.gz" -mtime +30 -delete

echo "Database backup completed: $BACKUP_FILE.gz"
```

### 2. Media Files Backup

```bash
#!/bin/bash

# Sync media files to backup location
rsync -av --delete /app/media/ /backups/media/

echo "Media files backup completed"
```

This comprehensive production deployment guide covers all aspects of transitioning from development to production, including security, performance, monitoring, and maintenance considerations.

---
