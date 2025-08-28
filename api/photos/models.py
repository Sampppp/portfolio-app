"""
defines the database schema, creates three main database tables that work together to manage photo library
"""

from django.db import models
from django.utils import timezone
import os

# Simple categorization system for photos
class Tag(models.Model):
    """Model for photo tags like 'portrait', 'landscape', etc."""
    name = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self): # tags display as their name in admin interface
        return self.name

    class Meta: # sorts tags alphabetically
        ordering = ['name']

# Stores comprehensive metadata about each photo file
class Photo(models.Model):
    """Model for storing photo metadata and information."""
    
    # File information
    file_name = models.CharField(max_length=255)
    file_path = models.CharField(max_length=500, unique=True)  # Relative path
    file_size = models.BigIntegerField(help_text="File size in bytes")
    
    # Photo metadata
    camera_name = models.CharField(max_length=100, blank=True, null=True)
    lens_name = models.CharField(max_length=100, blank=True, null=True)
    resolution_width = models.IntegerField(blank=True, null=True)
    resolution_height = models.IntegerField(blank=True, null=True)
    focal_length = models.FloatField(blank=True, null=True, help_text="Focal length in mm")
    shutter_speed = models.CharField(max_length=20, blank=True, null=True, help_text="e.g., '1/250'")
    aperture = models.CharField(max_length=10, blank=True, null=True, help_text="e.g., 'f/2.8'")
    iso = models.IntegerField(blank=True, null=True)
    
    # Dates
    date_captured = models.DateTimeField(blank=True, null=True)
    date_added = models.DateTimeField(auto_now_add=True)
    date_modified = models.DateTimeField(auto_now=True)
    
    # User content
    caption = models.TextField(blank=True, null=True, help_text="User-provided caption/description")
    
    # Tags relationship
    tags = models.ManyToManyField(Tag, blank=True, related_name='photos')
        
    def __str__(self):
        return self.file_name
    
    @property
    def resolution_string(self):
        """Return resolution as a string like '1920x1080'"""
        if self.resolution_width and self.resolution_height:
            return f"{self.resolution_width}x{self.resolution_height}"
        return None
    
    @property
    def file_extension(self):
        """Return the file extension"""
        return os.path.splitext(self.file_name)[1].lower()
    
    @property
    def is_image(self):
        """Check if the file is an image based on extension"""
        image_extensions = ['.jpg', '.jpeg', '.png']
        return self.file_extension in image_extensions
    
    class Meta: # Default sort by capture date then by date added
        ordering = ['-date_captured', '-date_added']
        indexes = [
            models.Index(fields=['date_captured']), # Database indexes on frequently queried fields
            models.Index(fields=['date_added']),
            models.Index(fields=['file_path']),
        ]

# Tracks automated scanning operations
class PhotoScanLog(models.Model):
    """Model to track when the image folder was last scanned for new photos."""
    scan_date = models.DateTimeField(auto_now_add=True)
    photos_found = models.IntegerField(default=0)
    photos_added = models.IntegerField(default=0)
    photos_updated = models.IntegerField(default=0)
    scan_duration = models.FloatField(help_text="Scan duration in seconds")
    errors = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"Scan on {self.scan_date.strftime('%Y-%m-%d %H:%M:%S')}"
    
    class Meta:
        ordering = ['-scan_date']
