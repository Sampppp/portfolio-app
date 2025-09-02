"""
Django REST Framework serializers for the photos application.

This module provides serializers that handle the conversion between Django model
instances and JSON representations for the REST API endpoints.
"""

from rest_framework import serializers
from .models import Photo, Tag, PhotoScanLog


class TagSerializer(serializers.ModelSerializer):
    """Serializer for Tag model with photo count information."""
    photo_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Tag
        fields = ['id', 'name', 'photo_count']
        read_only_fields = ['id']
    
    def get_photo_count(self, obj):
        """Return the number of photos associated with this tag."""
        # Use prefetched data if available, otherwise query
        if hasattr(obj, '_prefetched_objects_cache') and 'photos' in obj._prefetched_objects_cache:
            return len(obj._prefetched_objects_cache['photos'])
        return obj.photos.count()

class PhotoListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for Photo model used in list views.
    
    Provides minimal data needed for photo thumbnails and gallery displays,
    optimized for performance when loading multiple photos.
    """
    tags = TagSerializer(many=True, read_only=True)
    resolution_string = serializers.ReadOnlyField()
    file_extension = serializers.ReadOnlyField()
    image_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    thumbnail_webp_url = serializers.SerializerMethodField()
    thumbnail_jpeg_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Photo
        fields = [
            'id', 'file_name', 'file_path', 'file_size', 'resolution_width', 'resolution_height', 'date_captured', 'date_added', 'file_extension', 
            'caption', 'tags', 'resolution_string', 'image_url', 'thumbnail_url', 'thumbnail_webp_url', 'thumbnail_jpeg_url', 
            'has_thumbnail', 'thumbnail_width', 'thumbnail_height'
        ]
        read_only_fields = [
            'id', 'file_name', 'file_path', 'file_size', 'resolution_width', 'resolution_height', 'date_captured', 'date_added', 'file_extension',
            'has_thumbnail', 'thumbnail_width', 'thumbnail_height'
        ]
    
    def get_image_url(self, obj):
        """Generate URL for the image file."""
        if obj.file_path and obj.is_image:
            # Remove leading slash if present to avoid double slashes
            file_path = obj.file_path.lstrip('/')
            return f"/media/images/{file_path}"
        return None
    
    def get_thumbnail_url(self, obj):
        """Return the primary thumbnail URL (WebP preferred, JPEG fallback)."""
        if obj.has_thumbnail and obj.thumbnail_path:
            return f"/media/{obj.thumbnail_path.lstrip('/')}"
        return None
    
    def get_thumbnail_webp_url(self, obj):
        """Return WebP thumbnail URL if available."""
        if obj.has_thumbnail and obj.thumbnail_path:
            base_name = obj.file_name.split('.')[0]
            webp_path = f"thumbnails/{base_name}_thumb.webp"
            return f"/media/{webp_path}"
        return None
    
    def get_thumbnail_jpeg_url(self, obj):
        """Return JPEG thumbnail URL as fallback."""
        if obj.has_thumbnail and obj.thumbnail_path:
            base_name = obj.file_name.split('.')[0]
            jpeg_path = f"thumbnails/{base_name}_thumb.jpg"
            return f"/media/{jpeg_path}"
        return None
    

class PhotoDetailSerializer(serializers.ModelSerializer):
    """
    Complete serializer for Photo model used in detail views.
    
    Provides full photo metadata including EXIF data, camera information,
    and supports tag management through tag_names field.
    """
    tags = TagSerializer(many=True, read_only=True)
    tag_names = serializers.ListField(
        child=serializers.CharField(max_length=50),
        write_only=True,
        required=False,
        help_text="List of tag names to assign to this photo"
    )
    resolution_string = serializers.ReadOnlyField()
    file_extension = serializers.ReadOnlyField()
    is_image = serializers.ReadOnlyField()
    image_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.ReadOnlyField()
    
    class Meta:
        model = Photo
        fields = [
            'id', 'file_name', 'file_path', 'file_size', 'camera_name', 'lens_name', 'resolution_width', 'resolution_height', 'focal_length', 'shutter_speed', 'aperture', 'iso', 'date_captured', 'date_added', 'date_modified', 'file_extension', 'is_image',
            'resolution_string', 'caption', 'tags', 'tag_names', 'image_url', 'thumbnail_url', 'has_thumbnail', 'thumbnail_width', 'thumbnail_height'
        ]
        read_only_fields = [
            'id', 'file_name', 'file_path', 'file_size', 'camera_name', 'lens_name', 'resolution_width', 'resolution_height', 'focal_length', 'shutter_speed', 'aperture', 'iso', 'date_captured', 'date_added', 'date_modified', 'file_extension', 'is_image',
            'has_thumbnail', 'thumbnail_width', 'thumbnail_height'
        ]
    
    def get_image_url(self, obj):
        """Generate URL for the image file."""
        if obj.file_path and obj.is_image:
            # Remove leading slash if present to avoid double slashes
            file_path = obj.file_path.lstrip('/')
            return f"/media/images/{file_path}"
        return None
    
    def update(self, instance, validated_data):
        """Handle updating tags when tag_names is provided."""
        tag_names = validated_data.pop('tag_names', None)
        
        # Update the photo instance
        instance = super().update(instance, validated_data)
        
        # Handle tags if provided
        if tag_names is not None:
            # Clear existing tags
            instance.tags.clear()
            
            # Add new tags
            for tag_name in tag_names:
                tag, created = Tag.objects.get_or_create(name=tag_name.strip().lower())
                instance.tags.add(tag)
        
        return instance


class PhotoCaptionSerializer(serializers.ModelSerializer):
    """Serializer for updating only the caption of a photo."""
    
    class Meta:
        model = Photo
        fields = ['id', 'caption']
        read_only_fields = ['id']


class PhotoScanLogSerializer(serializers.ModelSerializer):
    """Serializer for PhotoScanLog model."""
    
    class Meta:
        model = PhotoScanLog
        fields = [
            'id', 'scan_date', 
            'photos_found', 'photos_added','photos_updated', 'scan_duration', 'errors'
        ]
        read_only_fields = ['id', 'scan_date']
