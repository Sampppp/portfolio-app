"""
creates the translation layer between your Django models and JSON data for your REST API. 
It defines how your photo data gets converted when sending/receiving API requests.
"""

from rest_framework import serializers
from .models import Photo, Tag, PhotoScanLog

# Simple JSON representation of tags
class TagSerializer(serializers.ModelSerializer):
    """Serializer for Tag model."""
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

# Lightweight version for photo gallery/list views, Basic info needed for photo thumbnails and lists
class PhotoListSerializer(serializers.ModelSerializer):
    """Serializer for Photo model in list views (minimal data)."""
    tags = TagSerializer(many=True, read_only=True)
    resolution_string = serializers.ReadOnlyField()
    file_extension = serializers.ReadOnlyField()
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Photo
        fields = [
            'id', 'file_name', 'file_path', 'file_size', 'resolution_width', 'resolution_height', 'date_captured', 'date_added', 'file_extension', 
            'caption', 'tags', 'resolution_string', 'image_url'
        ]
        read_only_fields = [
            'id', 'file_name', 'file_path', 'file_size', 'resolution_width', 'resolution_height', 'date_captured', 'date_added', 'file_extension'
        ]
    
    def get_image_url(self, obj):
        """Generate URL for the image file."""
        if obj.file_path and obj.is_image:
            # Remove leading slash if present to avoid double slashes
            file_path = obj.file_path.lstrip('/')
            return f"/media/{file_path}"
        return None
    

# Full photo data for individual photo views
class PhotoDetailSerializer(serializers.ModelSerializer):
    """Serializer for Photo model in detail views (full data)."""
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
    
    class Meta:
        model = Photo
        fields = [
            'id', 'file_name', 'file_path', 'file_size', 'camera_name', 'lens_name', 'resolution_width', 'resolution_height', 'focal_length', 'shutter_speed', 'aperture', 'iso', 'date_captured', 'date_added', 'date_modified', 'file_extension', 'is_image',
            'resolution_string', 'caption', 'tags', 'tag_names', 'image_url'
        ]
        read_only_fields = [
            'id', 'file_name', 'file_path', 'file_size', 'camera_name', 'lens_name', 'resolution_width', 'resolution_height', 'focal_length', 'shutter_speed', 'aperture', 'iso', 'date_captured', 'date_added', 'date_modified', 'file_extension', 'is_image'
        ]
    
    def get_image_url(self, obj):
        """Generate URL for the image file."""
        if obj.file_path and obj.is_image:
            # Remove leading slash if present to avoid double slashes
            file_path = obj.file_path.lstrip('/')
            return f"/media/{file_path}"
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
