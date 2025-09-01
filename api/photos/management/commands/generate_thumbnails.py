"""
Management command to generate thumbnails for existing photos.

This command will process all photos in the database that don't have thumbnails
and generate optimized thumbnail images for them.
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from photos.models import Photo
import time


class Command(BaseCommand):
    help = 'Generate thumbnails for existing photos'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Regenerate thumbnails even if they already exist',
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=50,
            help='Number of photos to process in each batch (default: 50)',
        )

    def handle(self, *args, **options):
        force = options['force']
        batch_size = options['batch_size']
        
        self.stdout.write(self.style.SUCCESS('Starting thumbnail generation...'))
        
        # Get photos that need thumbnails
        if force:
            photos = Photo.objects.filter(is_image=True)
            self.stdout.write(f'Processing all {photos.count()} photos (force mode)')
        else:
            photos = Photo.objects.filter(has_thumbnail=False)
            self.stdout.write(f'Processing {photos.count()} photos without thumbnails')
        
        if not photos.exists():
            self.stdout.write(self.style.SUCCESS('No photos need thumbnail generation.'))
            return
        
        total_photos = photos.count()
        processed = 0
        successful = 0
        failed = 0
        start_time = time.time()
        
        # Process photos in batches
        for i in range(0, total_photos, batch_size):
            batch = photos[i:i + batch_size]
            
            for photo in batch:
                try:
                    if photo.generate_thumbnail():
                        successful += 1
                        self.stdout.write(f'✓ Generated thumbnail for: {photo.file_name}')
                    else:
                        failed += 1
                        self.stdout.write(
                            self.style.WARNING(f'✗ Failed to generate thumbnail for: {photo.file_name}')
                        )
                except Exception as e:
                    failed += 1
                    self.stdout.write(
                        self.style.ERROR(f'✗ Error processing {photo.file_name}: {str(e)}')
                    )
                
                processed += 1
                
                # Progress update every 10 photos
                if processed % 10 == 0:
                    elapsed = time.time() - start_time
                    rate = processed / elapsed if elapsed > 0 else 0
                    remaining = total_photos - processed
                    eta = remaining / rate if rate > 0 else 0
                    
                    self.stdout.write(
                        f'Progress: {processed}/{total_photos} '
                        f'({processed/total_photos*100:.1f}%) - '
                        f'Rate: {rate:.1f} photos/sec - '
                        f'ETA: {eta:.0f}s'
                    )
        
        # Final summary
        elapsed = time.time() - start_time
        self.stdout.write(self.style.SUCCESS(
            f'\nThumbnail generation completed!\n'
            f'Total processed: {processed}\n'
            f'Successful: {successful}\n'
            f'Failed: {failed}\n'
            f'Time elapsed: {elapsed:.1f} seconds\n'
            f'Average rate: {processed/elapsed:.1f} photos/sec'
        ))
