# `settings.py` Django Settings

## Overview

The `api/portfolio/settings.py` file is the central configuration file for the Django REST API that powers a portfolio application with photo management capabilities. This file defines all the essential settings that control how Django operates, including database connections, security configurations, installed applications, and API behavior.

## Purpose

This Django REST API serves as the backend for a portfolio application that:
- Manages and serves photo collections
- Provides RESTful API endpoints for frontend consumption
- Handles cross-origin requests from web frontends
- Supports PostgreSQL database operations
- Implements pagination and JSON serialization

## Configuration Sections

### 1. Project Structure

#### `BASE_DIR`
- **Type**: `Path`
- **Purpose**: Establishes the root directory of the Django project
- **Usage**: Used as a reference point for all relative file paths throughout the application

### 2. Security Settings

#### `SECRET_KEY`
- **Type**: `str`
- **Purpose**: Cryptographic key used for signing sessions, cookies, and other security features
- **Current Value**: Development placeholder (must be changed for production)
- **Security Note**: Should be kept secret and unique in production environments

#### `DEBUG`
- **Type**: `bool`
- **Purpose**: Controls whether Django runs in debug mode
- **Current Value**: `True` (development setting)
- **Production Note**: Must be set to `False` in production for security

#### `ALLOWED_HOSTS`
- **Type**: `list`
- **Purpose**: Defines which host/domain names Django can serve
- **Current Value**: `['*']` (allows all hosts - development only)
- **Production Note**: Should be restricted to specific domains in production

### 3. Application Configuration

#### `INSTALLED_APPS`
Defines all Django applications that are activated in this project:

**Django Core Applications:**
- `django.contrib.admin` - Django admin interface
- `django.contrib.auth` - Authentication system
- `django.contrib.contenttypes` - Content type framework
- `django.contrib.sessions` - Session framework
- `django.contrib.messages` - Messaging framework
- `django.contrib.staticfiles` - Static file management

**Third-party Applications:**
- `rest_framework` - Django REST Framework for building APIs
- `corsheaders` - Cross-Origin Resource Sharing (CORS) support

**Local Applications:**
- `photos` - Custom application for photo management functionality

#### `MIDDLEWARE`
Defines the middleware stack that processes requests and responses:

1. `corsheaders.middleware.CorsMiddleware` - Handles CORS headers
2. `django.middleware.security.SecurityMiddleware` - Security enhancements
3. `django.contrib.sessions.middleware.SessionMiddleware` - Session support
4. `django.middleware.common.CommonMiddleware` - Common functionality
5. `django.middleware.csrf.CsrfViewMiddleware` - CSRF protection
6. `django.contrib.auth.middleware.AuthenticationMiddleware` - Authentication
7. `django.contrib.messages.middleware.MessageMiddleware` - Message support
8. `django.middleware.clickjacking.XFrameOptionsMiddleware` - Clickjacking protection

#### `ROOT_URLCONF`
- **Type**: `str`
- **Purpose**: Points to the main URL configuration module
- **Value**: `'portfolio.urls'`
- **Function**: Acts as the routing table for the entire project

### 4. Template Configuration

#### `TEMPLATES`
Configures Django's template engine:
- Uses Django's built-in template backend
- Automatically discovers templates in app directories
- Includes standard context processors for request handling

#### `WSGI_APPLICATION`
- **Type**: `str`
- **Purpose**: Points to the WSGI application callable
- **Value**: `'portfolio.wsgi.application'`
- **Function**: Creates the bridge between web server and Django application

### 5. Database Configuration

#### `DATABASES`
Configures PostgreSQL as the primary database:

- **Engine**: `django.db.backends.postgresql`
- **Environment Variables**: Uses environment variables with fallback defaults
  - `POSTGRES_DB` → Database name (default: 'photos')
  - `POSTGRES_USER` → Database user (default: 'portfolio')
  - `POSTGRES_PASSWORD` → Database password (default: 'strongpassword')
  - `POSTGRES_HOST` → Database host (default: 'localhost')
  - `PORT` → Database port (fixed: '5432')

### 6. Authentication & Security

#### `AUTH_PASSWORD_VALIDATORS`
Implements Django's built-in password validation:
- `UserAttributeSimilarityValidator` - Prevents passwords similar to user info
- `MinimumLengthValidator` - Enforces minimum password length
- `CommonPasswordValidator` - Blocks common passwords
- `NumericPasswordValidator` - Prevents purely numeric passwords

### 7. Internationalization

#### Localization Settings
- `LANGUAGE_CODE`: `'en-us'` - Default language
- `TIME_ZONE`: `'UTC'` - Default timezone for date/time storage
- `USE_I18N`: `True` - Enables internationalization support
- `USE_TZ`: `True` - Enables timezone-aware datetime handling

### 8. Static and Media Files

#### Static Files
- `STATIC_URL`: `'/static/'` - URL prefix for static files
- `STATIC_ROOT`: `os.path.join(BASE_DIR, 'staticfiles')` - Directory for collected static files

#### Media Files
- `MEDIA_URL`: `'/media/'` - URL prefix for user-uploaded media
- `MEDIA_ROOT`: Environment variable `PHOTOS_PATH` or default media directory

### 9. Database Models

#### `DEFAULT_AUTO_FIELD`
- **Type**: `str`
- **Purpose**: Sets the default primary key field type for new models
- **Value**: `'django.db.models.BigAutoField'`
- **Function**: Uses 64-bit integers for primary keys

### 10. Django REST Framework Configuration

#### `REST_FRAMEWORK`
Configures the Django REST Framework behavior:

- **Pagination**: 
  - Class: `PageNumberPagination`
  - Page Size: 20 items per page
- **Rendering**: JSON-only responses
- **Permissions**: `AllowAny` (no authentication required)
- **Authentication**: No authentication classes configured

### 11. CORS Configuration

#### Cross-Origin Resource Sharing Settings
- `CORS_ALLOWED_ORIGINS`: Specific allowed origins for development
  - `http://localhost:3000`
  - `http://127.0.0.1:3000`
- `CORS_ALLOW_ALL_ORIGINS`: `True` (development setting - allows all origins)

### 12. Custom Application Settings

#### `PHOTOS_PATH`
- **Type**: `str`
- **Purpose**: Defines the file system path where photos are stored
- **Source**: Environment variable `PHOTOS_PATH` or default `/app/images`
- **Usage**: Used by the photos application for file management

## Environment Variables

The application relies on several environment variables for configuration:

| Variable | Purpose | Default Value |
|----------|---------|---------------|
| `POSTGRES_DB` | Database name | `photos` |
| `POSTGRES_USER` | Database username | `portfolio` |
| `POSTGRES_PASSWORD` | Database password | `strongpassword` |
| `POSTGRES_HOST` | Database host | `localhost` |
| `PHOTOS_PATH` | Photo storage path | `/app/images` |

## Development vs Production

### Current Configuration
This configuration is optimized for development with:
- Debug mode enabled
- Permissive CORS settings
- Wildcard allowed hosts
- Default database credentials

### Production Considerations
For production deployment, consider:
- Setting `DEBUG = False`
- Restricting `ALLOWED_HOSTS` to specific domains
- Using secure, unique `SECRET_KEY`
- Configuring proper database credentials
- Restricting CORS origins
- Implementing proper authentication
- Using environment-specific settings files

## API Behavior

The REST Framework configuration creates an API that:
- Returns paginated JSON responses (20 items per page)
- Allows unrestricted access (no authentication required)
- Supports cross-origin requests from frontend applications
- Uses standard HTTP methods for CRUD operations
