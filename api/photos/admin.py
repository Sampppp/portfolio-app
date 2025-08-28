"""
creates user-friendly administrative panels for managing your photos, tags, and scan logs.
"""

from django.contrib import admin
from .models import Photo, Tag, PhotoScanLog

# Manages photo tags/categories
@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name', 'photo_count']
    search_fields = ['name']
    ordering = ['name']
    
    def photo_count(self, obj): # counts how many photos have each tag
        return obj.photos.count()
    photo_count.short_description = 'Photo Count'

# Main interface for managing individual photos
@admin.register(Photo)
class PhotoAdmin(admin.ModelAdmin):
    list_display = [ # Shows key photo info in a table
        'file_name', 'camera_name', 'lens_name', 'date_captured', 
        'tag_list', 'date_added'
    ]
    list_filter = [ # Adds sidebar filters for quick photo filtering
        'camera_name', 'lens_name', 'date_captured', 
        'date_added', 'tags'
    ]
    search_fields = [
        'file_name', 'caption', 'camera_name', 'lens_name', 'file_path'
    ]
    filter_horizontal = ['tags'] # Creates a nice widget for selecting multiple tags
    readonly_fields = [ # Prevents editing of automatically extracted metadata
        'file_name', 'file_path', 'file_size', 'camera_name', 'lens_name',
        'resolution_width', 'resolution_height', 'focal_length', 'shutter_speed',
        'aperture', 'iso', 'date_captured', 'date_added', 'date_modified',
        'file_extension', 'resolution_string', 'is_image'
    ]
    
    fieldsets = ( # Groups related fields into collapsible sections
        ('File Information', {
            'fields': ('file_name', 'file_path', 'file_size', 'file_extension', 'is_image')
        }),
        ('Camera Settings', {
            'fields': ('camera_name', 'lens_name', 'focal_length', 'shutter_speed', 'aperture', 'iso')
        }),
        ('Image Properties', {
            'fields': ('resolution_width', 'resolution_height', 'resolution_string')
        }),
        ('Dates', {
            'fields': ('date_captured', 'date_added', 'date_modified')
        }),
        ('Content', {
            'fields': ('caption', 'tags')
        }),
    )
    
    def tag_list(self, obj): # Shows all tags as a comma-separated list in the photo list view
        return ", ".join([tag.name for tag in obj.tags.all()])
    tag_list.short_description = 'Tags'
    
    def get_queryset(self, request): # Optimizes database queries by pre-loading tag relationships
        return super().get_queryset(request).prefetch_related('tags')

# Tracks automated photo scanning operations
@admin.register(PhotoScanLog)
class PhotoScanLogAdmin(admin.ModelAdmin):
    list_display = [ # Shows scan results
        'scan_date', 'photos_found', 'photos_added', 'photos_updated', 
        'scan_duration', 'has_errors'
    ]
    list_filter = ['scan_date']
    readonly_fields = [ # All fields are read-only since these are system-generated logs
        'scan_date', 'photos_found', 'photos_added', 'photos_updated', 
        'scan_duration', 'errors'
    ]
    ordering = ['-scan_date'] # Shows newest scans first
    
    def has_errors(self, obj):
        return bool(obj.errors)
    has_errors.boolean = True
    has_errors.short_description = 'Has Errors'
    
    def has_add_permission(self, request):
        # Prevent manual creation of scan logs
        return False
