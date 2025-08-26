import os
import time
from datetime import datetime
from django.core.management.base import BaseCommand
from django.conf import settings
from photos.models import Photo, PhotoScanLog
from PIL import Image
from PIL.ExifTags import TAGS
import exifread


class Command(BaseCommand):
    help = 'Scan NAS directory for photos and update database with metadata'

    def add_arguments(self, parser):
        parser.add_argument(
            '--path',
            type=str,
            default=settings.NAS_PHOTOS_PATH,
            help='Path to scan for photos (default: NAS_PHOTOS_PATH setting)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes'
        )

    def handle(self, *args, **options):
        start_time = time.time()
        scan_path = options['path']
        dry_run = options['dry_run']
        
        self.stdout.write(f"Scanning photos in: {scan_path}")
        if dry_run:
            self.stdout.write("DRY RUN MODE - No changes will be made")
        
        if not os.path.exists(scan_path):
            self.stdout.write(
                self.style.ERROR(f"Path does not exist: {scan_path}")
            )
            return
        
        photos_found = 0
        photos_added = 0
        photos_updated = 0
        errors = []
        
        # Supported image extensions
        image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.raw', '.cr2', '.nef'}
        
        # Walk through all files in the directory
        for root, dirs, files in os.walk(scan_path):
            for file in files:
                file_path = os.path.join(root, file)
                file_extension = os.path.splitext(file)[1].lower()
                
                if file_extension not in image_extensions:
                    continue
                
                photos_found += 1
                
                try:
                    # Get relative path from NAS mount point
                    relative_path = os.path.relpath(file_path, scan_path)
                    
                    # Check if photo already exists
                    photo, created = Photo.objects.get_or_create(
                        file_path=relative_path,
                        defaults={
                            'file_name': file,
                            'file_size': os.path.getsize(file_path),
                        }
                    )
                    
                    if created:
                        photos_added += 1
                        self.stdout.write(f"Added: {relative_path}")
                    else:
                        # Update file size if it changed
                        current_size = os.path.getsize(file_path)
                        if photo.file_size != current_size:
                            photo.file_size = current_size
                            photos_updated += 1
                            self.stdout.write(f"Updated: {relative_path}")
                    
                    # Extract metadata if not already present or if file was updated
                    if created or photos_updated > 0:
                        if not dry_run:
                            self.extract_metadata(photo, file_path)
                            photo.save()
                        else:
                            self.stdout.write(f"Would extract metadata for: {relative_path}")
                
                except Exception as e:
                    error_msg = f"Error processing {file_path}: {str(e)}"
                    errors.append(error_msg)
                    self.stdout.write(self.style.ERROR(error_msg))
        
        # Calculate scan duration
        scan_duration = time.time() - start_time
        
        # Create scan log
        if not dry_run:
            PhotoScanLog.objects.create(
                photos_found=photos_found,
                photos_added=photos_added,
                photos_updated=photos_updated,
                scan_duration=scan_duration,
                errors='\n'.join(errors) if errors else None
            )
        
        # Print summary
        self.stdout.write(
            self.style.SUCCESS(
                f"\nScan completed in {scan_duration:.2f} seconds:\n"
                f"Photos found: {photos_found}\n"
                f"Photos added: {photos_added}\n"
                f"Photos updated: {photos_updated}\n"
                f"Errors: {len(errors)}"
            )
        )

    def extract_metadata(self, photo, file_path):
        """Extract EXIF metadata from image file."""
        try:
            # Try with PIL first
            with Image.open(file_path) as img:
                # Get basic image info
                photo.resolution_width = img.width
                photo.resolution_height = img.height
                
                # Get EXIF data
                exif_data = img._getexif()
                if exif_data:
                    for tag_id, value in exif_data.items():
                        tag = TAGS.get(tag_id, tag_id)
                        
                        if tag == 'Make':
                            photo.camera_name = str(value)
                        elif tag == 'Model':
                            if photo.camera_name:
                                photo.camera_name = f"{photo.camera_name} {value}"
                            else:
                                photo.camera_name = str(value)
                        elif tag == 'LensModel':
                            photo.lens_name = str(value)
                        elif tag == 'FocalLength':
                            if isinstance(value, tuple) and len(value) == 2:
                                photo.focal_length = value[0] / value[1]
                            else:
                                photo.focal_length = float(value)
                        elif tag == 'ExposureTime':
                            if isinstance(value, tuple) and len(value) == 2:
                                photo.shutter_speed = f"1/{int(value[1]/value[0])}"
                            else:
                                photo.shutter_speed = str(value)
                        elif tag == 'FNumber':
                            if isinstance(value, tuple) and len(value) == 2:
                                photo.aperture = f"f/{value[0]/value[1]:.1f}"
                            else:
                                photo.aperture = f"f/{float(value):.1f}"
                        elif tag == 'ISOSpeedRatings':
                            photo.iso = int(value)
                        elif tag == 'DateTime':
                            try:
                                photo.date_captured = datetime.strptime(str(value), '%Y:%m:%d %H:%M:%S')
                            except ValueError:
                                pass
        
        except Exception as e:
            # Fallback to exifread for RAW files
            try:
                with open(file_path, 'rb') as f:
                    tags = exifread.process_file(f)
                    
                    if 'Image Make' in tags:
                        photo.camera_name = str(tags['Image Make'])
                    if 'Image Model' in tags:
                        if photo.camera_name:
                            photo.camera_name = f"{photo.camera_name} {tags['Image Model']}"
                        else:
                            photo.camera_name = str(tags['Image Model'])
                    if 'EXIF LensModel' in tags:
                        photo.lens_name = str(tags['EXIF LensModel'])
                    if 'EXIF FocalLength' in tags:
                        focal_length_str = str(tags['EXIF FocalLength'])
                        if '/' in focal_length_str:
                            num, den = focal_length_str.split('/')
                            photo.focal_length = float(num) / float(den)
                        else:
                            photo.focal_length = float(focal_length_str)
                    if 'EXIF ExposureTime' in tags:
                        photo.shutter_speed = str(tags['EXIF ExposureTime'])
                    if 'EXIF FNumber' in tags:
                        f_number_str = str(tags['EXIF FNumber'])
                        if '/' in f_number_str:
                            num, den = f_number_str.split('/')
                            photo.aperture = f"f/{float(num)/float(den):.1f}"
                        else:
                            photo.aperture = f"f/{float(f_number_str):.1f}"
                    if 'EXIF ISOSpeedRatings' in tags:
                        photo.iso = int(str(tags['EXIF ISOSpeedRatings']))
                    if 'EXIF DateTimeOriginal' in tags:
                        try:
                            photo.date_captured = datetime.strptime(
                                str(tags['EXIF DateTimeOriginal']), 
                                '%Y:%m:%d %H:%M:%S'
                            )
                        except ValueError:
                            pass
            
            except Exception as inner_e:
                self.stdout.write(
                    self.style.WARNING(f"Could not extract metadata from {file_path}: {inner_e}")
                )
