# `scan_photos.py` - Django Management Command

## Overview

The `scan_photos.py` is a Django management command that scans a specified directory for image files and maintains a database of photo metadata. It automatically extracts EXIF data from images, tracks file changes, and manages database entries to keep them synchronized with the filesystem.

## Purpose

This command serves several key functions:

1. **Photo Discovery**: Recursively scans directories to find image files
2. **Metadata Extraction**: Extracts EXIF data including camera settings, timestamps, and technical details
3. **Database Synchronization**: Adds new photos, updates existing entries, and removes orphaned records
4. **Audit Logging**: Creates scan logs with statistics and error tracking
5. **File System Monitoring**: Detects changes in file sizes and updates records accordingly

## Supported File Formats

The command supports the following image formats:
- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)

## Command Arguments

### Required Arguments
None - all arguments are optional with sensible defaults.

### Optional Arguments

#### `--path`
- **Type**: String
- **Default**: `settings.PHOTOS_PATH`
- **Description**: Specifies the root directory to scan for photos
- **Example**: `--path /home/user/photos`

#### `--dry-run`
- **Type**: Boolean flag
- **Default**: False
- **Description**: Enables preview mode - shows what actions would be taken without making any database changes
- **Example**: `--dry-run`

#### `--cleanup`
- **Type**: Boolean flag
- **Default**: True
- **Description**: Enables removal of database entries for photos that no longer exist in the filesystem
- **Example**: `--cleanup` (explicitly enable, though it's default)

#### `--no-cleanup`
- **Type**: Boolean flag
- **Default**: False
- **Description**: Disables cleanup of orphaned database entries
- **Example**: `--no-cleanup`

## Usage Examples

```bash
# Basic scan using default settings
python manage.py scan_photos

# Scan a specific directory
python manage.py scan_photos --path /path/to/photos

# Preview what would happen without making changes
python manage.py scan_photos --dry-run

# Scan without removing orphaned database entries
python manage.py scan_photos --no-cleanup

# Combine options
python manage.py scan_photos --path /custom/path --dry-run
```

## Functions Documentation

### `add_arguments(self, parser)`

**Purpose**: Configures command-line argument parsing for the management command.

**Parameters**:
- `parser`: Django's argument parser instance

**Functionality**:
- Defines all available command-line options
- Sets default values and help text
- Configures argument types and actions

### `handle(self, *args, **options)`

**Purpose**: Main execution method that orchestrates the entire photo scanning process.

**Parameters**:
- `*args`: Positional arguments (unused)
- `**options`: Dictionary containing parsed command-line options

**Functionality**:
1. **Initialization**: Sets up scan parameters and validates the target directory
2. **Directory Traversal**: Recursively walks through the specified directory
3. **File Processing**: 
   - Filters files by supported image extensions
   - Calculates relative paths from the scan root
   - Creates or updates Photo model instances
   - Tracks file size changes
4. **Metadata Extraction**: Calls `extract_metadata()` for new or updated photos
5. **Cleanup Operations**: Removes database entries for deleted files (if enabled)
6. **Safety Checks**: Prevents accidental mass deletion when no files are found
7. **Logging**: Creates PhotoScanLog entries with scan statistics
8. **Reporting**: Outputs detailed progress and summary information

**Error Handling**:
- Catches and logs individual file processing errors
- Continues processing remaining files after errors
- Implements safety checks for cleanup operations

### `extract_metadata(self, photo, file_path)`

**Purpose**: Extracts EXIF metadata from image files and populates Photo model fields.

**Parameters**:
- `photo`: Photo model instance to update
- `file_path`: Full filesystem path to the image file

**Functionality**:

#### Primary Method (PIL/Pillow):
- Opens image using PIL/Pillow library
- Extracts basic image properties (width, height)
- Processes EXIF data for camera and shooting information:
  - **Camera Information**: Make, Model
  - **Lens Information**: LensModel
  - **Technical Settings**: FocalLength, ExposureTime, FNumber, ISO
  - **Timestamps**: DateTime (when photo was taken)

**Extracted Metadata Fields**:
- `resolution_width`, `resolution_height`: Image dimensions
- `camera_name`: Camera make and model
- `lens_name`: Lens model information
- `focal_length`: Focal length in millimeters
- `shutter_speed`: Exposure time (e.g., "1/125")
- `aperture`: F-stop value (e.g., "f/2.8")
- `iso`: ISO sensitivity rating
- `date_captured`: Original capture timestamp

**Error Handling**:
- Gracefully handles missing or corrupted EXIF data
- Logs warnings for files that cannot be processed
- Continues operation even when metadata extraction fails

## Output and Logging

### Console Output
The command provides real-time feedback including:
- Scan progress with file paths
- Addition/update/removal notifications
- Error messages with file-specific details
- Final summary with statistics

### Database Logging
Creates `PhotoScanLog` entries containing:
- `photos_found`: Total images discovered
- `photos_added`: New database entries created
- `photos_updated`: Existing entries modified
- `photos_removed`: Orphaned entries deleted
- `scan_duration`: Total execution time
- `errors`: Concatenated error messages

## Safety Features

1. **Dry Run Mode**: Preview changes without database modifications
2. **Mass Deletion Protection**: Prevents cleanup when no files are found but many database entries exist
3. **Error Isolation**: Individual file errors don't stop the entire scan
4. **Comprehensive Logging**: All operations and errors are tracked

## Performance Considerations

- **Memory Efficient**: Processes files one at a time
- **Database Optimized**: Uses `get_or_create()` to minimize database queries
- **Progress Tracking**: Provides real-time feedback for long-running scans
- **Error Recovery**: Continues processing after individual file failures

## Dependencies

- **Django**: Core framework and ORM
- **PIL/Pillow**: Primary image processing and EXIF extraction
- **Python Standard Library**: `os`, `time`, `datetime` for file operations and timing

## Related Models

- **Photo**: Main model storing image metadata and file information
- **PhotoScanLog**: Audit log model tracking scan operations and statistics
