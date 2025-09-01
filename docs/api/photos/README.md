# Photos API Documentation

This section provides comprehensive documentation for the Photos API, including all endpoints, data models, and implementation details for the photo management system.

## Overview

The Photos API provides complete photo portfolio management functionality with:

- **Photo Management**: CRUD operations with metadata and EXIF data
- **Tag System**: Flexible categorization with many-to-many relationships
- **Advanced Search**: Multi-field search with filtering capabilities
- **Statistics**: Collection metrics and analytics
- **Audit Logging**: Photo scanning operation tracking

## API Endpoints

### Photo Endpoints

| Endpoint | Method | Description | Documentation |
|----------|--------|-------------|---------------|
| `/api/photos/` | GET | List photos with filtering | [Photo List](#photo-list) |
| `/api/photos/{id}/` | GET, PATCH, PUT | Photo details and updates | [Photo Detail](#photo-detail) |
| `/api/photos/{id}/caption/` | PATCH, PUT | Caption-only updates | [Photo Caption](#photo-caption) |
| `/api/photos/search/` | GET | Advanced search | [Photo Search](#photo-search) |
| `/api/photos/stats/` | GET | Collection statistics | [Photo Statistics](#photo-statistics) |

### Tag Endpoints

| Endpoint | Method | Description | Documentation |
|----------|--------|-------------|---------------|
| `/api/tags/` | GET, POST | List and create tags | [Tag List](#tag-list) |
| `/api/tags/{id}/` | GET, PATCH, PUT, DELETE | Tag management | [Tag Detail](#tag-detail) |
| `/api/tags/{tag_id}/photos/` | GET | Photos by tag | [Photos by Tag](#photos-by-tag) |

### Audit Endpoints

| Endpoint | Method | Description | Documentation |
|----------|--------|-------------|---------------|
| `/api/scan-logs/` | GET | Photo scan history | [Scan Logs](#scan-logs) |

## Data Models

### Photo Model
The core model storing comprehensive photo metadata and information.

**Key Fields**:
- **File Information**: `file_name`, `file_path`, `file_size`
- **Camera Metadata**: `camera_name`, `lens_name`, `focal_length`, `shutter_speed`, `aperture`, `iso`
- **Image Properties**: `resolution_width`, `resolution_height`
- **Dates**: `date_captured`, `date_added`, `date_modified`
- **User Content**: `caption`, `tags` (many-to-many)

**Computed Properties**:
- `resolution_string`: Formatted resolution (e.g., "1920x1080")
- `file_extension`: Lowercase file extension
- `is_image`: Boolean check for supported image formats

### Tag Model
Simple categorization system for photos.

**Fields**:
- `name`: Unique tag name (max 50 characters)

**Relationships**:
- Many-to-many with Photo model

### PhotoScanLog Model
Audit trail for photo scanning operations.

**Fields**:
- `scan_date`: When the scan was performed
- `photos_found`, `photos_added`, `photos_updated`, `photos_removed`: Operation counts
- `scan_duration`: Time taken in seconds
- `errors`: Error messages if any

## Detailed Endpoint Documentation

### Photo List
**Endpoint**: `GET /api/photos/`

Lists all photos with comprehensive filtering and search capabilities.

**Query Parameters**:
- `search`: Full-text search across file names, captions, camera, and lens
- `tags`: Comma-separated list of tag names
- `camera`: Filter by camera name (case-insensitive partial match)
- `lens`: Filter by lens name (case-insensitive partial match)
- `ordering`: Sort field (prefix with `-` for descending)

**Response**: Paginated list of photos using `PhotoListSerializer`

**Example**:
```bash
GET /api/photos/?search=sunset&tags=landscape,nature&ordering=-date_captured
```

### Photo Detail
**Endpoint**: `GET|PATCH|PUT /api/photos/{id}/`

Handles individual photo operations for retrieving and updating photo details.

**GET Response**: Complete photo metadata using `PhotoDetailSerializer`
**PATCH/PUT**: Updates photo caption and associated tags

**Example**:
```bash
# Get photo details
GET /api/photos/123/

# Update photo
PATCH /api/photos/123/
Content-Type: application/json
{
  "caption": "Updated caption",
  "tag_names": ["landscape", "sunset", "nature"]
}
```

### Photo Caption
**Endpoint**: `PATCH|PUT /api/photos/{id}/caption/`

Specialized endpoint for caption-only updates using `PhotoCaptionSerializer`.

**Example**:
```bash
PATCH /api/photos/123/caption/
Content-Type: application/json
{
  "caption": "Beautiful sunset over the mountains"
}
```

### Photo Search
**Endpoint**: `GET /api/photos/search/`

Advanced search endpoint with comprehensive filtering options.

**Query Parameters**:
- `q`: General search query
- `tags`: Comma-separated tag names
- `camera`: Camera name filter
- `lens`: Lens name filter
- `date_from`: Start date (YYYY-MM-DD)
- `date_to`: End date (YYYY-MM-DD)

**Features**:
- Complex queries using Django Q objects
- Date range filtering
- Pagination (20 items per page)
- Optimized with prefetch_related

**Example**:
```bash
GET /api/photos/search/?q=mountain&tags=landscape&date_from=2023-01-01&date_to=2023-12-31
```

### Photo Statistics
**Endpoint**: `GET /api/photos/stats/`

Provides statistical overview of the photo collection.

**Response**:
```json
{
  "total_photos": 1250,
  "total_tags": 45,
  "unique_cameras": 8,
  "unique_lenses": 12,
  "recent_photos": 23
}
```

### Tag List
**Endpoint**: `GET|POST /api/tags/`

Manages the collection of photo tags using `TagListView`.

**GET**: Lists all tags with photo counts
**POST**: Creates new tags

**Features**:
- Alphabetical ordering
- Photo count for each tag
- Optimized with prefetch_related

### Tag Detail
**Endpoint**: `GET|PATCH|PUT|DELETE /api/tags/{id}/`

Handles individual tag operations using `TagDetailView`.

**Features**:
- Full CRUD operations
- Cascade handling for photo relationships

### Photos by Tag
**Endpoint**: `GET /api/tags/{tag_id}/photos/`

Lists all photos associated with a specific tag using `PhotosByTagView`.

**Features**:
- Tag-filtered photo listing
- Consistent photo serialization
- Optimized queries

### Scan Logs
**Endpoint**: `GET /api/scan-logs/`

Lists photo scanning operation logs using `PhotoScanLogListView`.

**Features**:
- Chronological ordering (newest first)
- Audit trail for scanning operations
- Error tracking and monitoring

## Serializers

### PhotoListSerializer
Lightweight serializer optimized for photo list/gallery views.

**Use Cases**: Photo galleries, thumbnail grids, search results
**Key Features**: Minimal data set, fast loading, essential display information

### PhotoDetailSerializer
Complete serializer providing full photo information for detailed views.

**Use Cases**: Individual photo pages, editing interfaces, full metadata display
**Key Features**: Complete EXIF data, tag management via `tag_names` field

### PhotoCaptionSerializer
Minimal serializer for caption-only updates.

**Use Cases**: Quick caption editing, bulk caption updates
**Key Features**: Minimal payload, focused updates

### TagSerializer
Handles tag serialization with photo count information.

**Key Features**: Basic tag info, computed `photo_count` field, N+1 query optimization

### PhotoScanLogSerializer
Serializes photo scanning operation logs.

**Key Features**: Complete scan details, performance metrics, error tracking

## Views Architecture

### Class-Based Views
- **PhotoListView**: `generics.ListAPIView` for photo listing
- **PhotoDetailView**: `generics.RetrieveUpdateAPIView` for photo details
- **PhotoCaptionView**: `generics.UpdateAPIView` for caption updates
- **TagListView**: `generics.ListCreateAPIView` for tag management
- **TagDetailView**: `generics.RetrieveUpdateDestroyAPIView` for tag details
- **PhotosByTagView**: `generics.ListAPIView` for tag-filtered photos
- **PhotoScanLogListView**: `generics.ListAPIView` for scan logs

### Function-Based Views
- **photo_stats**: Statistical overview function
- **search_photos**: Advanced search with complex filtering

## Performance Optimizations

### Database Optimizations
- **Strategic Indexing**: Indexes on `date_captured`, `date_added`, `file_path`
- **Query Optimization**: `prefetch_related('tags')` to avoid N+1 queries
- **Efficient Filtering**: Database-level filtering vs. Python filtering

### API Optimizations
- **Pagination**: 20 items per page for large datasets
- **Selective Serialization**: Different serializers for different use cases
- **Caching Headers**: Appropriate cache control for resources

## Admin Interface

### PhotoAdmin
Comprehensive admin interface for photo management with:
- **List Display**: Essential photo information in tabular format
- **Search & Filter**: Full-text search and sidebar filters
- **Field Organization**: Grouped fields with readonly metadata
- **Query Optimization**: Prefetched relationships

### TagAdmin
Tag management interface with:
- **List Display**: Tag names with photo counts
- **Search**: Tag name searching
- **Ordering**: Alphabetical sorting

### PhotoScanLogAdmin
Scan log monitoring interface with:
- **List Display**: Scan statistics and error indicators
- **Filtering**: Date-based filtering
- **Readonly Access**: System-generated logs only

## Management Commands

### scan_photos Command
Django management command for photo discovery and metadata extraction.

**Features**:
- **Recursive Directory Scanning**: Discovers image files
- **EXIF Extraction**: Camera settings and metadata
- **Database Synchronization**: Adds, updates, removes photos
- **Audit Logging**: Creates PhotoScanLog entries
- **Safety Features**: Dry-run mode, mass deletion protection

**Usage**:
```bash
# Basic scan
python manage.py scan_photos

# Scan specific directory
python manage.py scan_photos --path /path/to/photos

# Preview mode
python manage.py scan_photos --dry-run

# Disable cleanup
python manage.py scan_photos --no-cleanup
```

## Integration Examples

### Frontend Integration
```javascript
// Fetch photos with search and filtering
async function loadPhotos(searchQuery, tags, page = 1) {
  const params = new URLSearchParams({
    search: searchQuery,
    tags: tags.join(','),
    page: page
  });
  
  const response = await fetch(`/api/photos/?${params}`);
  const data = await response.json();
  return data;
}

// Update photo caption
async function updateCaption(photoId, caption) {
  const response = await fetch(`/api/photos/${photoId}/caption/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ caption })
  });
  
  return response.json();
}
```

### Python Integration
```python
import requests

# Get collection statistics
def get_photo_stats():
    response = requests.get('http://localhost:8000/api/photos/stats/')
    return response.json()

# Search photos
def search_photos(query, tags=None):
    params = {'q': query}
    if tags:
        params['tags'] = ','.join(tags)
    
    response = requests.get('http://localhost:8000/api/photos/search/', params=params)
    return response.json()
```

## Error Handling

### Common Error Responses
- **404 Not Found**: Photo or tag doesn't exist
- **400 Bad Request**: Invalid query parameters or data
- **500 Internal Server Error**: Database or server errors

### Validation Errors
Field-specific validation errors are returned in structured format:
```json
{
  "field_errors": {
    "caption": ["Caption cannot be longer than 1000 characters"],
    "tag_names": ["Tag name cannot be empty"]
  }
}
```
