"""
defines the database schema, creates three main database tables that work together to manage photo library
"""

from django.db import models
from django.utils import timezone
import os
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self): # tags display as their name in admin interface
        return self.name

    class Meta: # sorts tags alphabetically
        ordering = ['name']

class Photo(models.Model):
    """Model for storing photo metadata and information."""
    
    # File information
    file_name = models.CharField(max_length=255)
    file_path = models.CharField(max_length=500, unique=True)  # Relative path
    file_size = models.BigIntegerField(help_text="File size in bytes")
    
    # Thumbnail information
    thumbnail_path = models.CharField(max_length=500, blank=True, null=True, help_text="Path to thumbnail image")
    thumbnail_width = models.IntegerField(blank=True, null=True)
    thumbnail_height = models.IntegerField(blank=True, null=True)
    has_thumbnail = models.BooleanField(default=False)
    
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
    
    def generate_thumbnail(self, size=(300, 300), quality=85, webp_quality=80):
        """Generate both WebP and JPEG thumbnails for this photo."""
        if not self.is_image or not self.file_path:
            return False
        
        from django.conf import settings
        
        # Full path to original image
        original_path = os.path.join(settings.MEDIA_ROOT, self.file_path.lstrip('/'))
        
        if not os.path.exists(original_path):
            return False
        
        try:
            # Open and process the image
            with Image.open(original_path) as img:
                # Convert to RGB if necessary (for PNG with transparency)
                if img.mode in ('RGBA', 'LA', 'P'):
                    # Create white background
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Create thumbnail with smart cropping (center crop)
                img.thumbnail(size, Image.Resampling.LANCZOS)
                
                # If image is smaller than target size, pad it
                if img.size != size:
                    # Create new image with target size and white background
                    new_img = Image.new('RGB', size, (255, 255, 255))
                    # Paste the thumbnail in the center
                    paste_x = (size[0] - img.size[0]) // 2
                    paste_y = (size[1] - img.size[1]) // 2
                    new_img.paste(img, (paste_x, paste_y))
                    img = new_img
                
                # Generate thumbnail directory
                thumbnail_dir = os.path.join(settings.MEDIA_ROOT, 'thumbnails')
                os.makedirs(thumbnail_dir, exist_ok=True)
                
                # Create thumbnail filenames
                base_name = os.path.splitext(self.file_name)[0]
                webp_filename = f"{base_name}_thumb.webp"
                jpeg_filename = f"{base_name}_thumb.jpg"
                
                webp_path = os.path.join(thumbnail_dir, webp_filename)
                jpeg_path = os.path.join(thumbnail_dir, jpeg_filename)
                
                # Save WebP thumbnail (primary format)
                try:
                    img.save(webp_path, 'WEBP', quality=webp_quality, optimize=True, method=6)
                    webp_success = True
                except Exception as e:
                    print(f"WebP save failed for {self.file_name}: {e}")
                    webp_success = False
                
                # Save JPEG thumbnail (fallback)
                img.save(jpeg_path, 'JPEG', quality=quality, optimize=True)
                
                # Update model fields - prefer WebP if available
                if webp_success:
                    self.thumbnail_path = f"thumbnails/{webp_filename}"
                else:
                    self.thumbnail_path = f"thumbnails/{jpeg_filename}"
                
                self.thumbnail_width = size[0]
                self.thumbnail_height = size[1]
                self.has_thumbnail = True
                self.save(update_fields=['thumbnail_path', 'thumbnail_width', 'thumbnail_height', 'has_thumbnail'])
                
                return True
                
        except Exception as e:
            print(f"Error generating thumbnail for {self.file_name}: {e}")
            return False
    
    @property
    def thumbnail_url(self):
        """Return URL for thumbnail image."""
        if self.has_thumbnail and self.thumbnail_path:
            return f"/media/{self.thumbnail_path.lstrip('/')}"
        return None
    
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
    photos_removed = models.IntegerField(default=0)
    scan_duration = models.FloatField(help_text="Scan duration in seconds")
    errors = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"Scan on {self.scan_date.strftime('%Y-%m-%d %H:%M:%S')}"
    
    class Meta:
        ordering = ['-scan_date']
