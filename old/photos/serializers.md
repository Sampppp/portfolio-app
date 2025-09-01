# `serializers.py` Photos Serializers

## Overview

The `api/photos/serializers.py` module contains Django REST Framework serializers that handle the conversion between Django model instances and JSON representations for the photos REST API. These serializers define how photo data is structured when sending and receiving API requests.

## Purpose

Serializers act as a translation layer between:
- Django model instances (Python objects)
- JSON data (API requests/responses)
- Data validation and transformation

## Serializer Classes

### TagSerializer

**Purpose**: Handles serialization of Tag model instances with additional photo count information.

**Key Features**:
- Provides basic tag information (id, name)
- Includes computed `photo_count` field showing number of associated photos
- Optimized to use prefetched data when available to avoid N+1 queries

**Fields**:
- `id` (read-only): Tag identifier
- `name`: Tag name
- `photo_count` (computed): Number of photos with this tag

**Methods**:
- `get_photo_count()`: Efficiently calculates photo count using prefetched data when available

---

### PhotoListSerializer

**Purpose**: Lightweight serializer optimized for photo list/gallery views where performance is critical.

**Use Cases**:
- Photo gallery displays
- Thumbnail grids
- Search results
- Any view showing multiple photos

**Key Features**:
- Minimal data set for fast loading
- Includes essential display information
- Provides image URL generation
- Read-only for most metadata fields

**Fields**:
- Basic info: `id`, `file_name`, `file_path`, `file_size`
- Display data: `resolution_width`, `resolution_height`, `resolution_string`
- Dates: `date_captured`, `date_added`
- User data: `caption`, `tags`
- Computed: `file_extension`, `image_url`

**Methods**:
- `get_image_url()`: Generates proper media URL for image display

---

### PhotoDetailSerializer

**Purpose**: Complete serializer providing full photo information for detailed views and editing.

**Use Cases**:
- Individual photo detail pages
- Photo editing interfaces
- Full metadata display
- Tag management

**Key Features**:
- Complete EXIF and metadata information
- Camera and lens details
- Tag management through `tag_names` field
- Full read/write capabilities for user-editable fields

**Fields**:
- **Basic Info**: `id`, `file_name`, `file_path`, `file_size`
- **Camera Data**: `camera_name`, `lens_name`, `focal_length`, `shutter_speed`, `aperture`, `iso`
- **Image Properties**: `resolution_width`, `resolution_height`, `resolution_string`, `is_image`
- **Dates**: `date_captured`, `date_added`, `date_modified`
- **User Data**: `caption`, `tags`, `tag_names`
- **Computed**: `file_extension`, `image_url`

**Special Fields**:
- `tag_names` (write-only): List of tag names for easy tag assignment
- `tags` (read-only): Full tag objects with details

**Methods**:
- `get_image_url()`: Generates proper media URL for image display
- `update()`: Custom update logic handling tag assignment via `tag_names`

**Tag Management**:
The serializer supports easy tag management through the `tag_names` field:
- Accepts a list of tag name strings
- Automatically creates new tags if they don't exist
- Replaces all existing tags with the provided list
- Tag names are normalized (stripped and lowercased)

---

### PhotoCaptionSerializer

**Purpose**: Minimal serializer for updating only photo captions.

**Use Cases**:
- Quick caption editing
- Bulk caption updates
- Caption-only API endpoints

**Key Features**:
- Minimal payload for performance
- Focused on single field updates
- Simple validation

**Fields**:
- `id` (read-only): Photo identifier
- `caption`: Photo caption text

---

### PhotoScanLogSerializer

**Purpose**: Serializes photo scanning operation logs for monitoring and debugging.

**Use Cases**:
- Scan history display
- System monitoring
- Debugging scan issues
- Performance tracking

**Key Features**:
- Complete scan operation details
- Performance metrics
- Error tracking

**Fields**:
- `id` (read-only): Log entry identifier
- `scan_date` (read-only): When the scan occurred
- `photos_found`: Total photos discovered during scan
- `photos_added`: New photos added to database
- `photos_updated`: Existing photos updated
- `scan_duration`: Time taken for scan operation
- `errors`: Any errors encountered during scanning

## Design Patterns

### Performance Optimization
- **PhotoListSerializer**: Minimal fields for fast list loading
- **TagSerializer**: Prefetch-aware photo counting
- **Read-only fields**: Prevent unnecessary database writes

### Data Transformation
- **Computed fields**: `resolution_string`, `file_extension`, `image_url`
- **Method fields**: Custom data generation and formatting
- **Property exposure**: Making model properties available via API

### User Experience
- **Tag management**: Simple string-based tag assignment
- **URL generation**: Automatic media URL creation
- **Flexible updates**: Specialized serializers for different update scenarios

## Usage Examples

### Tag Management
```python
# Update photo with new tags
data = {
    'caption': 'Updated caption',
    'tag_names': ['landscape', 'sunset', 'nature']
}
serializer = PhotoDetailSerializer(photo_instance, data=data, partial=True)
if serializer.is_valid():
    serializer.save()
```

### List View Optimization
```python
# Efficient photo list with prefetched tags
photos = Photo.objects.prefetch_related('tags').all()
serializer = PhotoListSerializer(photos, many=True)
return Response(serializer.data)
```

### Caption-only Updates
```python
# Quick caption update
serializer = PhotoCaptionSerializer(photo_instance, data={'caption': 'New caption'}, partial=True)
if serializer.is_valid():
    serializer.save()
```

## Integration Notes

- All serializers work with the Photo, Tag, and PhotoScanLog models
- Image URL generation assumes media files are served from `/media/` path
- Tag names are automatically normalized (lowercase, stripped)
- Most metadata fields are read-only to preserve data integrity
- Serializers are designed to work with the photos app's view classes and URL patterns
