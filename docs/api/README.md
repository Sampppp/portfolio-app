# API Documentation

This section provides comprehensive documentation for the Portfolio App's REST API, including endpoint specifications, data models, and integration guidelines.

## Overview

The Portfolio App API is built with Django REST Framework and provides RESTful endpoints for managing photo portfolios. The API supports:

- **Photo Management**: CRUD operations for photos with metadata
- **Tag System**: Flexible categorization and filtering
- **Search & Filter**: Advanced search across multiple fields
- **Statistics**: Collection metrics and analytics
- **Audit Logging**: Photo scanning operation tracking

## API Structure

### Base URL
- **Development**: `http://localhost:8000/api/`
- **Production**: `https://your-domain.com/api/`

### Authentication
- **Current**: No authentication required (public portfolio)
- **Future**: Token-based authentication for admin operations

### Response Format
- **Content Type**: `application/json`
- **Pagination**: 20 items per page (configurable)
- **Error Format**: Standard HTTP status codes with JSON error details

## API Sections

### [Photos API](photos/README.md)
Complete photo management functionality including:
- Photo listing with advanced filtering
- Individual photo details and updates
- Caption management
- Search capabilities
- Statistical data

### [Portfolio Configuration](portfolio/README.md)
Django project configuration and settings:
- Database configuration
- Security settings
- CORS configuration
- Media file handling

## Quick Start

### Basic Photo Listing
```bash
curl -X GET "http://localhost:8000/api/photos/"
```

### Search Photos
```bash
curl -X GET "http://localhost:8000/api/photos/search/?q=sunset&tags=landscape"
```

### Get Photo Details
```bash
curl -X GET "http://localhost:8000/api/photos/123/"
```

### Update Photo Caption
```bash
curl -X PATCH "http://localhost:8000/api/photos/123/caption/" \
  -H "Content-Type: application/json" \
  -d '{"caption": "Beautiful sunset over the mountains"}'
```

## Common Response Patterns

### Paginated List Response
```json
{
  "count": 150,
  "next": "http://localhost:8000/api/photos/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "file_name": "sunset.jpg",
      "caption": "Beautiful sunset",
      "tags": ["landscape", "sunset"],
      "date_captured": "2023-08-15T18:30:00Z"
    }
  ]
}
```

### Error Response
```json
{
  "error": "Photo not found",
  "detail": "No Photo matches the given query.",
  "status_code": 404
}
```

## Performance Considerations

### Optimizations Implemented
- **Database Indexing**: Strategic indexes on frequently queried fields
- **Query Optimization**: Prefetch related data to avoid N+1 queries
- **Pagination**: Efficient handling of large datasets
- **Caching Headers**: Appropriate cache control for different resource types

### Best Practices
- **Use Pagination**: Always handle paginated responses
- **Filter at API Level**: Use query parameters instead of client-side filtering
- **Batch Operations**: Minimize API calls where possible
- **Cache Responses**: Implement client-side caching for static data

## Integration Examples

### JavaScript/Fetch
```javascript
// Fetch photos with search
async function searchPhotos(query, tags) {
  const params = new URLSearchParams({
    q: query,
    tags: tags.join(',')
  });
  
  const response = await fetch(`/api/photos/search/?${params}`);
  const data = await response.json();
  return data.results;
}
```

### Python/Requests
```python
import requests

# Get photo statistics
response = requests.get('http://localhost:8000/api/photos/stats/')
stats = response.json()
print(f"Total photos: {stats['total_photos']}")
```

### cURL Examples
```bash
# Get all tags with photo counts
curl -X GET "http://localhost:8000/api/tags/"

# Create a new tag
curl -X POST "http://localhost:8000/api/tags/" \
  -H "Content-Type: application/json" \
  -d '{"name": "architecture"}'

# Get photos by tag
curl -X GET "http://localhost:8000/api/tags/5/photos/"
```

## Error Handling

### HTTP Status Codes
- **200 OK**: Successful GET, PATCH, PUT requests
- **201 Created**: Successful POST requests
- **400 Bad Request**: Invalid request data
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side errors

### Error Response Format
All errors return JSON with consistent structure:
```json
{
  "error": "Brief error description",
  "detail": "Detailed error message",
  "status_code": 400,
  "field_errors": {
    "field_name": ["Specific field error message"]
  }
}
```

## Rate Limiting

### Current Limits
- **No rate limiting**: Currently no restrictions (development/demo)
- **Future Implementation**: Rate limiting planned for production

### Recommended Usage
- **Reasonable Request Frequency**: Avoid excessive API calls
- **Batch Operations**: Group related operations when possible
- **Caching**: Implement client-side caching for frequently accessed data

## API Versioning

### Current Version
- **Version**: v1 (implicit)
- **URL Structure**: `/api/` (no version prefix currently)

### Future Versioning
- **Planned**: `/api/v1/`, `/api/v2/` structure
- **Backward Compatibility**: Maintained for major versions
- **Deprecation Policy**: 6-month notice for breaking changes

## Development and Testing

### Local Development
```bash
# Start the API server
cd api
python manage.py runserver

# API available at http://localhost:8000/api/
```

### Testing Endpoints
```bash
# Test API health
curl -X GET "http://localhost:8000/api/photos/stats/"

# Test search functionality
curl -X GET "http://localhost:8000/api/photos/search/?q=test"
```

## Support and Resources

### Documentation
- **API Reference**: Detailed endpoint documentation in subsections
- **Model Documentation**: Database schema and relationships
- **Performance Guide**: Optimization recommendations

### Development Tools
- **Django Admin**: `http://localhost:8000/admin/` for data management
- **API Browser**: Django REST Framework browsable API
- **Database Tools**: PostgreSQL admin tools for data inspection
