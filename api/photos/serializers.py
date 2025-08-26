from rest_framework import serializers
from .models import Photo, Tag, PhotoScanLog


class TagSerializer(serializers.ModelSerializer):
    """Serializer for Tag model."""
    
    class Meta:
        model = Tag
        fields = ['id', 'name', 'created_at']
        read_only_fields = ['id', 'created_at']


class PhotoListSerializer(serializers.ModelSerializer):
    """Serializer for Photo model in list views (minimal data)."""
    tags = TagSerializer(many=True, read_only=True)
    resolution_string = serializers.ReadOnlyField()
    file_extension = serializers.ReadOnlyField()
    
    class Meta:
        model = Photo
        fields = [
            'id', 'file_name', 'file_path', 'file_size',
            'resolution_width', 'resolution_height', 'resolution_string',
            'date_captured', 'date_added', 'caption', 'tags',
            'file_extension', 'is_public'
        ]
        read_only_fields = [
            'id', 'file_name', 'file_path', 'file_size',
            'resolution_width', 'resolution_height', 'date_captured',
            'date_added', 'file_extension'
        ]


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
    
    class Meta:
        model = Photo
        fields = [
            'id', 'file_name', 'file_path', 'file_size',
            'camera_name', 'lens_name', 'resolution_width', 'resolution_height',
            'resolution_string', 'focal_length', 'shutter_speed', 'aperture', 'iso',
            'date_captured', 'date_added', 'date_modified',
            'caption', 'tags', 'tag_names', 'is_public',
            'file_extension', 'is_image'
        ]
        read_only_fields = [
            'id', 'file_name', 'file_path', 'file_size',
            'camera_name', 'lens_name', 'resolution_width', 'resolution_height',
            'focal_length', 'shutter_speed', 'aperture', 'iso',
            'date_captured', 'date_added', 'date_modified',
            'file_extension', 'is_image'
        ]
    
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
            'id', 'scan_date', 'photos_found', 'photos_added',
            'photos_updated', 'scan_duration', 'errors'
        ]
        read_only_fields = ['id', 'scan_date']
