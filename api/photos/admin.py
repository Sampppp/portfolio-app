from django.contrib import admin
from .models import Photo, Tag, PhotoScanLog


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at', 'photo_count']
    search_fields = ['name']
    ordering = ['name']
    
    def photo_count(self, obj):
        return obj.photos.count()
    photo_count.short_description = 'Photo Count'


@admin.register(Photo)
class PhotoAdmin(admin.ModelAdmin):
    list_display = [
        'file_name', 'camera_name', 'lens_name', 'date_captured', 
        'is_public', 'tag_list', 'date_added'
    ]
    list_filter = [
        'is_public', 'camera_name', 'lens_name', 'date_captured', 
        'date_added', 'tags'
    ]
    search_fields = [
        'file_name', 'caption', 'camera_name', 'lens_name', 'file_path'
    ]
    filter_horizontal = ['tags']
    readonly_fields = [
        'file_name', 'file_path', 'file_size', 'camera_name', 'lens_name',
        'resolution_width', 'resolution_height', 'focal_length', 'shutter_speed',
        'aperture', 'iso', 'date_captured', 'date_added', 'date_modified',
        'file_extension', 'resolution_string', 'is_image'
    ]
    
    fieldsets = (
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
            'fields': ('caption', 'tags', 'is_public')
        }),
    )
    
    def tag_list(self, obj):
        return ", ".join([tag.name for tag in obj.tags.all()])
    tag_list.short_description = 'Tags'
    
    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related('tags')


@admin.register(PhotoScanLog)
class PhotoScanLogAdmin(admin.ModelAdmin):
    list_display = [
        'scan_date', 'photos_found', 'photos_added', 'photos_updated', 
        'scan_duration', 'has_errors'
    ]
    list_filter = ['scan_date']
    readonly_fields = [
        'scan_date', 'photos_found', 'photos_added', 'photos_updated', 
        'scan_duration', 'errors'
    ]
    ordering = ['-scan_date']
    
    def has_errors(self, obj):
        return bool(obj.errors)
    has_errors.boolean = True
    has_errors.short_description = 'Has Errors'
    
    def has_add_permission(self, request):
        # Prevent manual creation of scan logs
        return False
