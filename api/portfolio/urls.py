"""
URL configuration for portfolio project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def health_check(request):
    """Simple health check endpoint"""
    return JsonResponse({'status': 'healthy', 'message': 'Django is running'})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('photos.urls')),
    path('health/', health_check),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
