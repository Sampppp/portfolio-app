# `views.py` Photos Views

## Overview

The `api/photos/views.py` file serves as the controller layer in the Django REST API, creating REST endpoints that connect the frontend to the photo portfolio backend. It acts as the bridge between the models (database layer) and serializers (JSON conversion layer) to provide a functional web API for photo management operations.

## Purpose

This module provides comprehensive REST API endpoints for:
- Listing and filtering photos with advanced search capabilities
- Managing individual photo details and metadata
- CRUD operations for photo tags
- Statistical data about the photo collection
- Advanced search functionality with multiple filter options
- Photo scanning log management

## Classes and Views

### PhotoListView
**Type:** Class-based view (generics.ListAPIView)  
**Endpoint:** `/api/photos/`  
**HTTP Methods:** GET

Lists all photos with comprehensive filtering and search capabilities.

**Features:**
- **Search:** Full-text search across file names, captions, camera names, and lens names
- **Tag Filtering:** Filter photos by tag names (comma-separated)
- **Equipment Filtering:** Filter by camera name or lens name
- **Ordering:** Sort by date captured, date added, file name, or file size
- **Default Ordering:** Most recent photos first (by capture date, then by date added)

**Query Parameters:**
- `search`: Search term for file names, captions, camera, and lens
- `tags`: Comma-separated list of tag names
- `camera`: Filter by camera name (case-insensitive partial match)
- `lens`: Filter by lens name (case-insensitive partial match)
- `ordering`: Sort field (prefix with `-` for descending order)

**Example Usage:**
```
GET /api/photos/?search=sunset&tags=landscape,nature&camera=canon&ordering=-date_captured
```

### PhotoDetailView
**Type:** Class-based view (generics.RetrieveUpdateAPIView)  
**Endpoint:** `/api/photos/<id>/`  
**HTTP Methods:** GET, PATCH, PUT  
**Permissions:** AllowAny  
**CSRF:** Exempt

Handles individual photo operations for retrieving and updating photo details.

**Features:**
- **GET:** Returns complete photo metadata including EXIF data, tags, and file information
- **PATCH/PUT:** Updates photo caption and associated tags
- **Full Metadata:** Includes camera settings, location data, file details, and relationships

### PhotoCaptionView
**Type:** Class-based view (generics.UpdateAPIView)  
**Endpoint:** `/api/photos/<id>/caption/`  
**HTTP Methods:** PATCH, PUT  
**Permissions:** AllowAny  
**CSRF:** Exempt

Specialized endpoint for updating only the caption field of a photo.

**Features:**
- Lightweight update operation for caption-only changes
- Optimized for quick caption editing workflows
- Maintains data integrity while allowing partial updates

### TagListView
**Type:** Class-based view (generics.ListCreateAPIView)  
**Endpoint:** `/api/tags/`  
**HTTP Methods:** GET, POST  
**Permissions:** AllowAny  
**CSRF:** Exempt

Manages the collection of photo tags.

**Features:**
- **GET:** Lists all tags with associated photo counts
- **POST:** Creates new tags
- **Ordering:** Alphabetical by tag name
- **Relationships:** Includes photo count for each tag via prefetch_related optimization

### TagDetailView
**Type:** Class-based view (generics.RetrieveUpdateDestroyAPIView)  
**Endpoint:** `/api/tags/<id>/`  
**HTTP Methods:** GET, PATCH, PUT, DELETE  
**Permissions:** AllowAny  
**CSRF:** Exempt

Handles individual tag operations.

**Features:**
- **GET:** Retrieve specific tag details
- **PATCH/PUT:** Update tag information
- **DELETE:** Remove tag (with cascade handling for photo relationships)

### PhotosByTagView
**Type:** Class-based view (generics.ListAPIView)  
**Endpoint:** `/api/tags/<tag_id>/photos/`  
**HTTP Methods:** GET

Lists all photos associated with a specific tag.

**Features:**
- Filtered photo listing by tag relationship
- Optimized with prefetch_related for tag data
- Maintains consistent photo serialization format

## Function-Based Views

### photo_stats
**Type:** Function-based view (@api_view(['GET']))  
**Endpoint:** `/api/photos/stats/`  
**HTTP Methods:** GET

Provides statistical overview of the photo collection.

**Returns:**
- `total_photos`: Total number of photos in the collection
- `total_tags`: Total number of unique tags
- `unique_cameras`: Count of distinct camera models
- `unique_lenses`: Count of distinct lens models
- `recent_photos`: Number of photos added in the last 30 days

**Example Response:**
```json
{
    "total_photos": 1250,
    "total_tags": 45,
    "unique_cameras": 8,
    "unique_lenses": 12,
    "recent_photos": 23
}
```

### search_photos
**Type:** Function-based view (@api_view(['GET']))  
**Endpoint:** `/api/photos/search/`  
**HTTP Methods:** GET

Advanced search endpoint with comprehensive filtering options.

**Query Parameters:**
- `q`: General search query (searches file names, captions, camera, lens)
- `tags`: Comma-separated list of tag names
- `camera`: Camera name filter (case-insensitive partial match)
- `lens`: Lens name filter (case-insensitive partial match)
- `date_from`: Start date filter (YYYY-MM-DD format)
- `date_to`: End date filter (YYYY-MM-DD format)

**Features:**
- **Complex Queries:** Uses Django Q objects for OR-based text searching
- **Date Range Filtering:** Supports date-based photo filtering
- **Pagination:** Built-in pagination with 20 items per page
- **Error Handling:** Graceful handling of invalid date formats
- **Performance:** Optimized with prefetch_related for tag relationships

**Example Usage:**
```
GET /api/photos/search/?q=mountain&tags=landscape&date_from=2023-01-01&date_to=2023-12-31
```

### PhotoScanLogListView
**Type:** Class-based view (generics.ListAPIView)  
**Endpoint:** `/api/photos/scan-logs/`  
**HTTP Methods:** GET

Lists photo scanning operation logs for tracking image folder scanning history.

**Features:**
- **Audit Trail:** Maintains history of photo scanning operations
- **Ordering:** Most recent scans first
- **Monitoring:** Helps track when photos were discovered and processed

## Technical Implementation Details

### Performance Optimizations
- **Prefetch Related:** Uses `prefetch_related('tags')` to minimize database queries
- **Selective Filtering:** Applies filters at the database level rather than in Python
- **Pagination:** Implements pagination for large result sets in search functionality

### Security Considerations
- **CSRF Exemption:** Several views use `@method_decorator(csrf_exempt)` for API compatibility
- **Permissions:** Uses `AllowAny` permission class for public photo portfolio access
- **Input Validation:** Implements proper date format validation and error handling

### Database Query Patterns
- **Efficient Filtering:** Uses Django ORM's `filter()` and `Q` objects for complex queries
- **Distinct Results:** Applies `.distinct()` when filtering by many-to-many relationships
- **Case-Insensitive Search:** Uses `icontains` for user-friendly search functionality

### Error Handling
- **Date Parsing:** Graceful handling of invalid date formats in search parameters
- **Missing Parameters:** Proper handling of optional query parameters
- **Database Errors:** Relies on Django's built-in error handling for database operations

## API Endpoint Summary

| Endpoint | Method | Purpose | Key Features |
|----------|--------|---------|--------------|
| `/api/photos/` | GET | List photos | Search, filter, ordering |
| `/api/photos/<id>/` | GET, PATCH, PUT | Photo details | Full metadata, updates |
| `/api/photos/<id>/caption/` | PATCH, PUT | Update caption | Caption-only updates |
| `/api/tags/` | GET, POST | Manage tags | List with counts, create |
| `/api/tags/<id>/` | GET, PATCH, PUT, DELETE | Tag details | Full CRUD operations |
| `/api/tags/<tag_id>/photos/` | GET | Photos by tag | Tag-filtered photos |
| `/api/photos/stats/` | GET | Collection stats | Overview statistics |
| `/api/photos/search/` | GET | Advanced search | Complex filtering |
| `/api/photos/scan-logs/` | GET | Scan history | Operation tracking |

This views module provides a comprehensive REST API interface for managing a photo portfolio, with robust search capabilities, efficient database operations, and proper separation of concerns following Django REST framework best practices.
