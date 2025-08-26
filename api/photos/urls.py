from django.urls import path
from . import views

urlpatterns = [
    # Photo endpoints
    path('photos/', views.PhotoListView.as_view(), name='photo-list'),
    path('photos/<int:pk>/', views.PhotoDetailView.as_view(), name='photo-detail'),
    path('photos/<int:pk>/caption/', views.PhotoCaptionView.as_view(), name='photo-caption'),
    path('photos/search/', views.search_photos, name='photo-search'),
    path('photos/stats/', views.photo_stats, name='photo-stats'),
    
    # Tag endpoints
    path('tags/', views.TagListView.as_view(), name='tag-list'),
    path('tags/<int:pk>/', views.TagDetailView.as_view(), name='tag-detail'),
    path('tags/<int:tag_id>/photos/', views.PhotosByTagView.as_view(), name='photos-by-tag'),
    
    # Scan log endpoints
    path('scan-logs/', views.PhotoScanLogListView.as_view(), name='scan-log-list'),
]
