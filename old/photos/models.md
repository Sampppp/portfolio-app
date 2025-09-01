# `models.py` Photos Models

## Overview

The `api/photos/models.py` file defines the database schema for the photo management system in this Django REST API. It creates three main database tables that work together to manage a comprehensive photo library with metadata, categorization, and scanning capabilities.

## Models

### 1. Tag Model

```python
class Tag(models.Model):
```

**Purpose**: Provides a simple categorization system for photos using descriptive tags.

**Key Features**:
- Stores tag names like 'portrait', 'landscape', 'nature', etc.
- Ensures unique tag names across the system
- Automatically sorts tags alphabetically for consistent display
- Used in many-to-many relationship with Photo model

**Fields**:
- `name` (CharField): The tag name, max 50 characters, must be unique

**Methods**:
- `__str__()`: Returns the tag name for display in admin interface and string representations

**Meta Options**:
- `ordering = ['name']`: Sorts tags alphabetically by default

---

### 2. Photo Model

```python
class Photo(models.Model):
```

**Purpose**: The core model that stores comprehensive metadata and information about each photo file in the library.

**Key Features**:
- Stores file system information (path, size, name)
- Captures detailed camera/lens metadata (EXIF data)
- Tracks important dates (capture, added, modified)
- Supports user-generated content (captions)
- Links to tags for categorization
- Includes database indexes for performance optimization

#### Field Categories

**File Information**:
- `file_name` (CharField): Original filename, max 255 characters
- `file_path` (CharField): Relative path to file, max 500 characters, unique
- `file_size` (BigIntegerField): File size in bytes

**Camera/Lens Metadata** (all optional):
- `camera_name` (CharField): Camera model name
- `lens_name` (CharField): Lens model name
- `resolution_width` (IntegerField): Image width in pixels
- `resolution_height` (IntegerField): Image height in pixels
- `focal_length` (FloatField): Focal length in millimeters
- `shutter_speed` (CharField): Shutter speed (e.g., '1/250')
- `aperture` (CharField): Aperture setting (e.g., 'f/2.8')
- `iso` (IntegerField): ISO sensitivity value

**Date Tracking**:
- `date_captured` (DateTimeField): When the photo was originally taken (optional)
- `date_added` (DateTimeField): When added to database (auto-set)
- `date_modified` (DateTimeField): Last modification time (auto-updated)

**User Content**:
- `caption` (TextField): User-provided description or caption (optional)

**Relationships**:
- `tags` (ManyToManyField): Links to Tag model for categorization

#### Properties

**`resolution_string`**: 
- Returns formatted resolution like '1920x1080'
- Returns None if width/height not available

**`file_extension`**: 
- Extracts and returns lowercase file extension
- Uses `os.path.splitext()` for reliable parsing

**`is_image`**: 
- Boolean check if file is a supported image format
- Currently supports: .jpg, .jpeg, .png

#### Meta Options

**Ordering**: 
- Primary: `-date_captured` (newest photos first)
- Secondary: `-date_added` (recently added first)

**Database Indexes**: 
- `date_captured`: For chronological queries
- `date_added`: For recent additions
- `file_path`: For file system operations

---

### 3. PhotoScanLog Model

```python
class PhotoScanLog(models.Model):
```

**Purpose**: Tracks automated scanning operations that synchronize the database with the file system, maintaining an audit trail of scan activities.

**Key Features**:
- Records scan statistics and performance metrics
- Tracks changes made during each scan operation
- Stores error information for troubleshooting
- Provides historical record of scan activities

**Fields**:
- `scan_date` (DateTimeField): When the scan was performed (auto-set)
- `photos_found` (IntegerField): Total photos discovered in file system
- `photos_added` (IntegerField): New photos added to database
- `photos_updated` (IntegerField): Existing photos that were updated
- `photos_removed` (IntegerField): Photos removed from database
- `scan_duration` (FloatField): How long the scan took in seconds
- `errors` (TextField): Any errors encountered during scanning (optional)

**Methods**:
- `__str__()`: Returns formatted scan date for display

**Meta Options**:
- `ordering = ['-scan_date']`: Shows most recent scans first

## Model Relationships

```
Tag ←→ Photo (Many-to-Many)
- One photo can have multiple tags
- One tag can be applied to multiple photos
- Relationship managed through Django's ManyToManyField

PhotoScanLog (Independent)
- Standalone model for audit/logging purposes
- No direct relationships with other models
```

## Database Design Considerations

### Performance Optimizations
- **Indexes**: Strategic indexes on frequently queried fields (`date_captured`, `date_added`, `file_path`)
- **Field Types**: Appropriate field types for data (BigIntegerField for file sizes, FloatField for measurements)

### Data Integrity
- **Unique Constraints**: `file_path` uniqueness prevents duplicates
- **Validation**: Built-in Django field validation for data types and lengths

### Flexibility
- **Optional Fields**: Most metadata fields are optional to handle varying EXIF data availability
- **Extensible**: Easy to add new fields or relationships as requirements evolve

## Usage in Django REST API

These models serve as the foundation for:
- **API Endpoints**: Serialized and exposed through Django REST Framework
- **Admin Interface**: Manageable through Django admin
- **File System Sync**: Used by management commands to sync with actual photo files
- **Search/Filter**: Support complex queries for photo discovery and organization

## Related Files

- `serializers.py`: Converts model instances to/from JSON for API responses
- `views.py`: Handles HTTP requests and uses these models for data operations
- `admin.py`: Configures Django admin interface for these models
- `management/commands/scan_photos.py`: Uses PhotoScanLog to track scanning operations
