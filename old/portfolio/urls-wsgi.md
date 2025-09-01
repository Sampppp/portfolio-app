# `urls.py` and wsgi.py Django Configuration Files

## Overview

The portfolio project is a Django REST API that serves as a backend for a photo portfolio application. The configuration is split across several key files that handle URL routing and WSGI deployment.

## Files Documentation

### `api/portfolio/urls.py`

**Purpose**: Main URL configuration file that defines the routing structure for the entire Django application.

**Key Components**:

- **URL Patterns**: Defines the main URL routing structure
  - `admin/` - Routes to Django's built-in admin interface
  - `api/` - Routes to the photos app URLs, creating the main API endpoint structure

- **Static File Serving**: Configures media file serving during development
  - Only active when `DEBUG=True` in settings
  - Serves uploaded images and other media files from the `MEDIA_ROOT` directory
  - Essential for development but handled by web server (nginx/Apache) in production

**Architecture Role**:
- Acts as the main entry point for all HTTP requests
- Delegates API-specific routing to the `photos.urls` module
- Provides access to Django's admin interface for content management
- Handles static media serving in development environment

**Request Flow**:
1. Incoming HTTP request hits Django
2. URL dispatcher checks patterns in this file
3. Requests to `/api/` are forwarded to `photos.urls` for further routing
4. Requests to `/admin/` go to Django's admin interface
5. Media files are served directly in development mode

### `api/portfolio/wsgi.py`

**Purpose**: Web Server Gateway Interface (WSGI) configuration file that serves as the entry point for WSGI-compatible web servers.

**Key Components**:

- **WSGI Application**: Exposes the Django application as a WSGI callable
- **Settings Module**: Configures which Django settings module to use
- **Environment Setup**: Sets the default Django settings module path

**Architecture Role**:
- Provides the interface between the Django application and web servers
- Required for deployment to production servers (Gunicorn, uWSGI, mod_wsgi)
- Handles the initialization of the Django application for web server processes
- Sets up the Python environment for Django to run

**Deployment Context**:
- Used by WSGI servers like Gunicorn in production
- Referenced in Docker containers and deployment configurations
- Critical for scaling the application across multiple server processes
- Ensures proper Django application initialization in server environments

## Integration with Portfolio API

Both files work together to create a functional Django REST API:

1. **WSGI Entry Point**: `wsgi.py` initializes the Django application for web servers
2. **Request Routing**: `urls.py` handles incoming requests and routes them appropriately
3. **API Structure**: The `/api/` endpoint provides RESTful access to photo portfolio data
4. **Admin Interface**: The `/admin/` endpoint allows content management through Django's admin
5. **Media Handling**: Static file serving ensures uploaded photos are accessible during development

## Development vs Production

**Development**:
- Media files served directly by Django
- Debug mode enables detailed error pages
- Built-in development server can use these configurations directly

**Production**:
- WSGI server (like Gunicorn) uses `wsgi.py` to run the application
- Web server (nginx/Apache) handles static/media files instead of Django
- URL routing remains the same but performance is optimized

## Related Files

- `api/portfolio/settings.py` - Contains all Django configuration settings
- `api/photos/urls.py` - Defines specific API endpoints for photo operations
- `api/photos/views.py` - Contains the actual API view logic
- `docker-compose.yml` - Uses these configurations for containerized deployment
