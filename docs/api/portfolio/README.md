# Portfolio Configuration Documentation

This section provides comprehensive documentation for the Django project configuration, including settings, URL routing, and WSGI deployment configuration.

## Overview

The Portfolio project configuration manages:

- **Django Settings**: Database, security, and application configuration
- **URL Routing**: Request routing and endpoint organization
- **WSGI Deployment**: Web server integration and production deployment
- **Environment Configuration**: Development and production settings

## Configuration Files

### [Django Settings](settings.md)
Central configuration file controlling all Django behavior:
- Database connections and configuration
- Security settings and authentication
- Installed applications and middleware
- Static and media file handling
- REST Framework configuration
- CORS settings for frontend integration

### [URL Configuration](urls.md)
Main URL routing structure:
- API endpoint organization
- Admin interface routing
- Static file serving (development)
- Request flow and delegation

### [WSGI Configuration](wsgi.md)
Web Server Gateway Interface setup:
- Production deployment configuration
- Web server integration
- Application initialization

## Quick Reference

### Key Settings

| Setting | Purpose | Default Value |
|---------|---------|---------------|
| `DEBUG` | Development mode | `True` (dev only) |
| `ALLOWED_HOSTS` | Permitted hosts | `['*']` (dev only) |
| `SECRET_KEY` | Cryptographic key | Development placeholder |
| `DATABASES` | Database config | PostgreSQL with env vars |
| `PHOTOS_PATH` | Photo storage path | `/app/images` |

### Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `POSTGRES_DB` | Database name | `photos` |
| `POSTGRES_USER` | Database user | `portfolio` |
| `POSTGRES_PASSWORD` | Database password | `strongpassword` |
| `POSTGRES_HOST` | Database host | `localhost` |
| `PHOTOS_PATH` | Photo directory | `/app/images` |

### URL Structure

| Pattern | Purpose | Handler |
|---------|---------|---------|
| `admin/` | Django admin | Built-in admin |
| `api/` | REST API endpoints | Photos app URLs |
| `media/` | Uploaded files | Static file serving |

## Development Configuration

### Current Setup
The configuration is optimized for development with:

```python
# Development settings
DEBUG = True
ALLOWED_HOSTS = ['*']
CORS_ALLOW_ALL_ORIGINS = True

# Database with defaults
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('POSTGRES_DB', 'photos'),
        'USER': os.environ.get('POSTGRES_USER', 'portfolio'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'strongpassword'),
        'HOST': os.environ.get('POSTGRES_HOST', 'localhost'),
        'PORT': '5432',
    }
}
```

### Local Development Setup

```bash
# Set environment variables
export POSTGRES_DB=photos
export POSTGRES_USER=portfolio
export POSTGRES_PASSWORD=strongpassword
export POSTGRES_HOST=localhost
export PHOTOS_PATH=/path/to/your/photos

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

## Production Configuration

### Security Considerations

For production deployment, update these settings:

```python
# Production security
DEBUG = False
ALLOWED_HOSTS = ['your-domain.com', 'www.your-domain.com']
SECRET_KEY = 'your-secure-secret-key'

# CORS restrictions
CORS_ALLOWED_ORIGINS = [
    "https://your-frontend-domain.com",
]
CORS_ALLOW_ALL_ORIGINS = False

# Additional security headers
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
```

### Database Configuration

Production database setup:

```python
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
    }
}
```

### Static Files

Production static file configuration:

```python
# Static files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.environ.get('PHOTOS_PATH', '/app/media')

# Additional static file settings
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'
```

## REST Framework Configuration

### Current API Settings

```python
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
}
```

### Authentication Setup

For authenticated endpoints (future implementation):

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
}
```

## CORS Configuration

### Development CORS

```python
# Allow all origins (development only)
CORS_ALLOW_ALL_ORIGINS = True

# Specific origins for development
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

### Production CORS

```python
# Restrict to specific origins
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "https://your-frontend-domain.com",
    "https://www.your-frontend-domain.com",
]

# Additional CORS settings
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
```

## Middleware Configuration

### Current Middleware Stack

```python
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
```

### Production Middleware Additions

```python
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Static files
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
```

## Application Configuration

### Installed Apps

```python
INSTALLED_APPS = [
    # Django core
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party
    'rest_framework',
    'corsheaders',
    
    # Local apps
    'photos',
]
```

### App-Specific Settings

```python
# Photos app configuration
PHOTOS_PATH = os.environ.get('PHOTOS_PATH', '/app/images')

# Default auto field for models
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
```

## Deployment Configurations

### Docker Configuration

Environment variables for Docker deployment:

```yaml
# docker-compose.yml environment
environment:
  - POSTGRES_DB=photos
  - POSTGRES_USER=portfolio
  - POSTGRES_PASSWORD=strongpassword
  - POSTGRES_HOST=db
  - PHOTOS_PATH=/app/images
  - DEBUG=False
  - ALLOWED_HOSTS=your-domain.com,www.your-domain.com
```

### WSGI Deployment

Production WSGI configuration:

```python
# wsgi.py
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'portfolio.settings')
application = get_wsgi_application()
```

### Gunicorn Configuration

```bash
# gunicorn command
gunicorn portfolio.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 3 \
  --timeout 120 \
  --max-requests 1000 \
  --max-requests-jitter 100
```

## Monitoring and Logging

### Logging Configuration

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/app/logs/django.log',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
        'photos': {
            'handlers': ['file', 'console'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}
```

### Performance Monitoring

```python
# Database connection pooling
DATABASES['default']['CONN_MAX_AGE'] = 60

# Cache configuration
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
    }
}
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check environment variables
   - Verify PostgreSQL is running
   - Confirm network connectivity

2. **CORS Issues**
   - Verify CORS_ALLOWED_ORIGINS
   - Check frontend domain configuration
   - Ensure corsheaders middleware is first

3. **Static File Issues**
   - Run `python manage.py collectstatic`
   - Check STATIC_ROOT configuration
   - Verify web server static file serving

4. **Media File Access**
   - Check PHOTOS_PATH environment variable
   - Verify file permissions
   - Confirm media URL configuration

### Debug Commands

```bash
# Check configuration
python manage.py check

# Test database connection
python manage.py dbshell

# Collect static files
python manage.py collectstatic

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

---

*Portfolio Configuration Documentation - Last updated: January 2025*
