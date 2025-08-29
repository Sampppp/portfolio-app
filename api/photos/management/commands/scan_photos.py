import os
import time
from datetime import datetime
from django.core.management.base import BaseCommand
from django.conf import settings
from photos.models import Photo, PhotoScanLog
from PIL import Image
from PIL.ExifTags import TAGS


class Command(BaseCommand):
    help = 'Scan image folder directory for photos and update database with metadata'

    def add_arguments(self, parser):
        parser.add_argument(
            '--path',
            type=str,
            default=settings.PHOTOS_PATH,
            help='Path to scan for photos (default: PHOTOS_PATH setting)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes'
        )
        parser.add_argument(
            '--cleanup',
            action='store_true',
            default=True,
            help='Remove database entries for photos that no longer exist in filesystem (default: True)'
        )
        parser.add_argument(
            '--no-cleanup',
            dest='cleanup',
            action='store_false',
            help='Skip cleanup of orphaned database entries'
        )

    def handle(self, *args, **options):
        start_time = time.time()
        scan_path = options['path']
        dry_run = options['dry_run']
        cleanup = options['cleanup']
        
        self.stdout.write(f"Scanning photos in: {scan_path}")
        if dry_run:
            self.stdout.write("DRY RUN MODE - No changes will be made")
        if cleanup:
            self.stdout.write("Cleanup enabled - will remove orphaned database entries")
        
        if not os.path.exists(scan_path):
            self.stdout.write(
                self.style.ERROR(f"Path does not exist: {scan_path}")
            )
            return
        
        photos_found = 0
        photos_added = 0
        photos_updated = 0
        photos_removed = 0
        errors = []
        
        # Track all valid image files found during scan
        found_file_paths = set()
        
        # Supported image extensions
        image_extensions = {'.jpg', '.jpeg', '.png'}
        
        # Walk through all files in the directory
        for root, dirs, files in os.walk(scan_path):
            for file in files:
                file_path = os.path.join(root, file)
                file_extension = os.path.splitext(file)[1].lower()
                
                if file_extension not in image_extensions:
                    continue
                
                photos_found += 1
                
                try:
                    # Get relative path from image folder
                    relative_path = os.path.relpath(file_path, scan_path)
                    
                    # Track this file path as found
                    found_file_paths.add(relative_path)
                    
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
        
        # Cleanup orphaned database entries if requested
        if cleanup:
            try:
                # Find photos in database that don't exist in filesystem
                orphaned_photos = Photo.objects.exclude(file_path__in=found_file_paths)
                orphaned_count = orphaned_photos.count()
                
                if orphaned_count > 0:
                    self.stdout.write(f"\nFound {orphaned_count} orphaned database entries")
                    
                    # Safety check - don't delete everything if no files were found
                    if len(found_file_paths) == 0 and orphaned_count > 10:
                        self.stdout.write(
                            self.style.WARNING(
                                f"Safety check: No files found but {orphaned_count} database entries exist. "
                                "Skipping cleanup to prevent accidental mass deletion. "
                                "Check your image path and try again."
                            )
                        )
                    else:
                        for orphaned_photo in orphaned_photos:
                            if dry_run:
                                self.stdout.write(f"Would remove: {orphaned_photo.file_path}")
                            else:
                                self.stdout.write(f"Removed: {orphaned_photo.file_path}")
                                orphaned_photo.delete()
                        
                        if not dry_run:
                            photos_removed = orphaned_count
                        else:
                            photos_removed = 0
                else:
                    self.stdout.write("No orphaned database entries found")
                    
            except Exception as e:
                error_msg = f"Error during cleanup: {str(e)}"
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
                photos_removed=photos_removed,
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
                f"Photos removed: {photos_removed}\n"
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
            self.stdout.write(
                self.style.WARNING(f"Could not extract metadata from {file_path}: {e}")
            )
