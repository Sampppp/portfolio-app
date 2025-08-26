"""
configuration for your photos app, tells Django how to set up and identify this particular app within your larger project
"""

from django.apps import AppConfig


class PhotosConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField' # sets default primary key type for models in this app
    name = 'photos' # internal Python name, Used for database table prefixes (your tables will be named photos_photo, photos_tag, etc.)
    verbose_name = 'Photo Portfolio' # Human-readable name displayed in Django's admin interface
