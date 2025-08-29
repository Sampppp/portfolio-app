# `urls.py` Photos URL Configuration

## Overview

The `api/photos/urls.py` file defines the URL routing configuration for the photos Django REST API application. It maps URL patterns to their corresponding view functions and classes, establishing the API endpoint structure that connects HTTP requests to the appropriate backend logic. This file serves as the central routing hub for all photo-related API operations.

## Purpose

This module provides URL routing for:
- Photo management endpoints (CRUD operations, search, statistics)
- Tag management endpoints (categorization system)
- Photo scanning log endpoints (audit trail and monitoring)
- RESTful API structure following Django conventions
- Clean, predictable URL patterns for frontend integration

## URL Pattern Structure

The URL patterns are organized into three main categories, each serving distinct functional areas of the photo management system.

## Photo Endpoints

### Photo List
**Pattern:** `photos/`  
**Name:** `photo-list`  
**View:** `PhotoListView.as_view()`  
**HTTP Methods:** GET

Primary endpoint for retrieving the photo collection with comprehensive filtering and search capabilities.

**Features:**
- Lists all photos in the system
- Supports advanced filtering by tags, camera, lens
- Full-text search across multiple fields
- Customizable ordering options
- Pagination for large collections

**Example URLs:**
```
GET /api/photos/
GET /api/photos/?search=sunset
GET /api/photos/?tags=landscape,nature
GET /api/photos/?camera=canon&ordering=-date_captured
```

### Photo Detail
**Pattern:** `photos/<int:pk>/`  
**Name:** `photo-detail`  
**View:** `PhotoDetailView.as_view()`  
**HTTP Methods:** GET, PATCH, PUT

Individual photo management endpoint for retrieving and updating specific photos.

**Features:**
- Retrieves complete photo metadata and EXIF data
- Updates photo captions and tag associations
- Full CRUD operations on individual photo records
- Supports partial updates via PATCH method

**URL Parameters:**
- `pk` (int): Primary key of the photo record

**Example URLs:**
```
GET /api/photos/123/
PATCH /api/photos/123/
PUT /api/photos/123/
```

### Photo Caption
**Pattern:** `photos/<int:pk>/caption/`  
**Name:** `photo-caption`  
**View:** `PhotoCaptionView.as_view()`  
**HTTP Methods:** PATCH, PUT

Specialized endpoint for caption-only updates, optimized for quick editing workflows.

**Features:**
- Lightweight caption editing without full photo update
- Maintains data integrity during partial updates
- Optimized for frontend caption editing interfaces

**URL Parameters:**
- `pk` (int): Primary key of the photo record

**Example URLs:**
```
PATCH /api/photos/123/caption/
PUT /api/photos/123/caption/
```

### Photo Search
**Pattern:** `photos/search/`  
**Name:** `photo-search`  
**View:** `search_photos`  
**HTTP Methods:** GET

Advanced search endpoint with comprehensive filtering options and complex query capabilities.

**Features:**
- Multi-field text search with OR logic
- Date range filtering
- Equipment-based filtering
- Tag-based filtering
- Pagination for search results

**Query Parameters:**
- `q`: General search query
- `tags`: Comma-separated tag names
- `camera`: Camera name filter
- `lens`: Lens name filter
- `date_from`: Start date (YYYY-MM-DD)
- `date_to`: End date (YYYY-MM-DD)

**Example URLs:**
```
GET /api/photos/search/?q=mountain&tags=landscape
GET /api/photos/search/?date_from=2023-01-01&date_to=2023-12-31
```

### Photo Statistics
**Pattern:** `photos/stats/`  
**Name:** `photo-stats`  
**View:** `photo_stats`  
**HTTP Methods:** GET

Statistical overview endpoint providing collection metrics and summary information.

**Features:**
- Total photo count
- Tag statistics
- Equipment diversity metrics
- Recent activity tracking
- Dashboard-ready data format

**Example URL:**
```
GET /api/photos/stats/
```

## Tag Endpoints

### Tag List
**Pattern:** `tags/`  
**Name:** `tag-list`  
**View:** `TagListView.as_view()`  
**HTTP Methods:** GET, POST

Tag collection management for the photo categorization system.

**Features:**
- Lists all available tags with photo counts
- Creates new tags for photo categorization
- Alphabetical ordering for consistent display
- Optimized queries with photo count aggregation

**Example URLs:**
```
GET /api/tags/
POST /api/tags/
```

### Tag Detail
**Pattern:** `tags/<int:pk>/`  
**Name:** `tag-detail`  
**View:** `TagDetailView.as_view()`  
**HTTP Methods:** GET, PATCH, PUT, DELETE

Individual tag management with full CRUD operations.

**Features:**
- Retrieves specific tag information
- Updates tag properties
- Deletes tags with proper cascade handling
- Maintains referential integrity with photo relationships

**URL Parameters:**
- `pk` (int): Primary key of the tag record

**Example URLs:**
```
GET /api/tags/5/
PATCH /api/tags/5/
PUT /api/tags/5/
DELETE /api/tags/5/
```

### Photos by Tag
**Pattern:** `tags/<int:tag_id>/photos/`  
**Name:** `photos-by-tag`  
**View:** `PhotosByTagView.as_view()`  
**HTTP Methods:** GET

Filtered photo listing endpoint showing all photos associated with a specific tag.

**Features:**
- Tag-filtered photo collection
- Maintains consistent photo serialization
- Optimized with prefetch_related for performance
- Supports pagination for large tag collections

**URL Parameters:**
- `tag_id` (int): Primary key of the tag record

**Example URL:**
```
GET /api/tags/5/photos/
```

## Scan Log Endpoints

### Scan Log List
**Pattern:** `scan-logs/`  
**Name:** `scan-log-list`  
**View:** `PhotoScanLogListView.as_view()`  
**HTTP Methods:** GET

Audit trail endpoint for photo scanning operations and system monitoring.

**Features:**
- Lists all photo scanning operations
- Chronological ordering (most recent first)
- Scan statistics and performance metrics
- Error tracking and troubleshooting information

**Example URL:**
```
GET /api/scan-logs/
```

## URL Pattern Design Principles

### RESTful Conventions
- **Resource-based URLs**: Clear noun-based endpoint names
- **HTTP Method Mapping**: Proper use of GET, POST, PATCH, PUT, DELETE
- **Hierarchical Structure**: Logical nesting for related resources
- **Consistent Naming**: Predictable patterns across all endpoints

### URL Parameter Types
- **Primary Keys**: Integer-based IDs for resource identification
- **Query Parameters**: Flexible filtering and search options
- **Path Parameters**: Required resource identifiers in URL path

### Naming Conventions
- **Kebab-case**: Consistent hyphenated naming for URL names
- **Descriptive Names**: Clear, self-documenting endpoint purposes
- **Namespace Consistency**: All names prefixed with resource type

## API Endpoint Summary

| Endpoint | Methods | Purpose | Key Features |
|----------|---------|---------|--------------|
| `photos/` | GET | List photos | Search, filter, pagination |
| `photos/<pk>/` | GET, PATCH, PUT | Photo details | Full metadata, updates |
| `photos/<pk>/caption/` | PATCH, PUT | Caption updates | Lightweight editing |
| `photos/search/` | GET | Advanced search | Complex filtering |
| `photos/stats/` | GET | Collection stats | Metrics and counts |
| `tags/` | GET, POST | Tag management | List, create tags |
| `tags/<pk>/` | GET, PATCH, PUT, DELETE | Tag details | Full CRUD operations |
| `tags/<tag_id>/photos/` | GET | Tagged photos | Filtered photo lists |
| `scan-logs/` | GET | Scan history | Audit trail |

## Integration with Django Framework

### URL Resolution
- **Reverse URL Lookup**: Named patterns enable `reverse()` function usage
- **Template Integration**: URL names work with `{% url %}` template tags
- **API Documentation**: Named patterns support automatic API documentation

### View Integration
- **Class-based Views**: Seamless integration with Django REST Framework
- **Function-based Views**: Support for custom logic and complex operations
- **Middleware Compatibility**: Works with Django's middleware stack

### Security Considerations
- **Parameter Validation**: Integer constraints prevent invalid ID access
- **URL Encoding**: Proper handling of special characters in parameters
- **Path Traversal Protection**: Django's built-in URL resolution security

## Related Files

- `views.py`: Contains the view classes and functions referenced in URL patterns
- `../portfolio/urls.py`: Main project URLs that include this photos URL configuration
- `serializers.py`: Handles data serialization for API responses
- `models.py`: Defines the data models that views operate on

This URL configuration provides a comprehensive, RESTful API structure that supports all aspects of photo management, from basic CRUD operations to advanced search and analytics capabilities.
