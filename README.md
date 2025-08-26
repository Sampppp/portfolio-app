# Portfolio App

A web portfolio application to display photos with metadata, built with Django REST API backend and React frontend.

## Architecture

- **Backend**: Django REST API with PostgreSQL database
- **Frontend**: React with Tailwind CSS (served by nginx)
- **Database**: PostgreSQL for photo metadata storage
- **Storage**: NAS integration for photo files

## Features

- Photo metadata extraction (camera, lens, EXIF data)
- Tagging system for organizing photos
- Public portfolio display
- Caption/description management
- Advanced search and filtering
- NAS integration for automatic photo discovery

## API Endpoints

### Photos
- `GET /api/photos/` - List all public photos (with filtering)
- `GET /api/photos/{id}/` - Get photo details
- `PATCH /api/photos/{id}/` - Update photo (caption, tags, visibility)
- `PATCH /api/photos/{id}/caption/` - Update only caption
- `GET /api/photos/search/` - Advanced photo search
- `GET /api/photos/stats/` - Photo collection statistics

### Tags
- `GET /api/tags/` - List all tags
- `POST /api/tags/` - Create new tag
- `GET /api/tags/{id}/` - Get tag details
- `GET /api/tags/{id}/photos/` - Get photos with specific tag

### Scan Logs
- `GET /api/scan-logs/` - View NAS scan history

## Setup Instructions

### 1. Configure NAS Mount
Update the volume mount in `docker-compose.yml`:
```yaml
volumes:
  - /path/to/your/nas/photos:/nas/photos:ro
```

### 2. Start Services
```bash
docker compose up -d
```

### 3. Run Database Migrations
```bash
docker compose exec api python manage.py migrate
```

### 4. Create Admin User
```bash
docker compose exec api python manage.py createsuperuser
```

### 5. Scan Photos from NAS
```bash
docker compose exec api python manage.py scan_photos
```

## Environment Variables

- `POSTGRES_USER` - Database username
- `POSTGRES_PASSWORD` - Database password
- `POSTGRES_DB` - Database name
- `POSTGRES_HOST` - Database host
- `NAS_PHOTOS_PATH` - Path to NAS photos inside container

## Photo Metadata

The system extracts and stores the following metadata:
- Camera name and model
- Lens name
- Resolution (width/height)
- Focal length
- Shutter speed
- Aperture
- ISO
- Date captured
- File size
- File name and path

## Usage

1. Mount your NAS photos directory to `/nas/photos` in the container
2. Run the `scan_photos` management command to discover and index photos
3. Use the API endpoints to retrieve photos and metadata
4. Access the admin interface at `http://localhost:8100/admin/` to manage photos and tags
5. The frontend will be available at the configured nginx port

## Development

- API runs on port 8100
- PostgreSQL runs on default port 5432 (internal)
- Admin interface: `http://localhost:8100/admin/`
- API documentation: `http://localhost:8100/api/`

## Photo Organization

Photos can be organized using tags. Common tag examples:
- `portrait` - Portrait photography
- `landscape` - Landscape photography  
- `street` - Street photography
- `macro` - Macro photography
- `event` - Event photography

Tags are automatically created when assigned to photos and can be managed through the admin interface or API.
