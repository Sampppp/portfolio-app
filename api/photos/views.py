"""
creates the REST API endpoints that your frontend can call to interact with your photo portfolio. 
It's the "controller" layer that connects your models (database) and serializers (JSON conversion) to create a functional web API
"""


from rest_framework import generics, status, filters
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import Photo, Tag, PhotoScanLog
from .serializers import (
    PhotoListSerializer, PhotoDetailSerializer, PhotoCaptionSerializer,
    TagSerializer, PhotoScanLogSerializer
)


class PhotoListView(generics.ListAPIView):
    """
    List all photos with filtering and search capabilities.
    
    Query parameters:
    - search: Search in file names and captions
    - tags: Filter by tag names (comma-separated)
    - camera: Filter by camera name
    - lens: Filter by lens name
    - ordering: Order by fields (e.g., -date_captured, file_name)
    """
    serializer_class = PhotoListSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['file_name', 'caption', 'camera_name', 'lens_name']
    ordering_fields = ['date_captured', 'date_added', 'file_name', 'file_size']
    ordering = ['-date_captured', '-date_added']
    
    def get_queryset(self):
        queryset = Photo.objects.filter().prefetch_related('tags')
        
        # Filter by tags
        tags = self.request.query_params.get('tags', None)
        if tags:
            tag_list = [tag.strip().lower() for tag in tags.split(',')]
            queryset = queryset.filter(tags__name__in=tag_list).distinct()
        
        # Filter by camera
        camera = self.request.query_params.get('camera', None)
        if camera:
            queryset = queryset.filter(camera_name__icontains=camera)
        
        # Filter by lens
        lens = self.request.query_params.get('lens', None)
        if lens:
            queryset = queryset.filter(lens_name__icontains=lens)
        
        return queryset


@method_decorator(csrf_exempt, name='dispatch')
class PhotoDetailView(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update a specific photo.
    
    GET: Returns full photo details including all metadata
    PATCH/PUT: Update caption and tags
    """
    queryset = Photo.objects.filter()
    serializer_class = PhotoDetailSerializer
    permission_classes = [AllowAny]


@method_decorator(csrf_exempt, name='dispatch')
class PhotoCaptionView(generics.UpdateAPIView):
    """
    Update only the caption of a specific photo.
    """
    queryset = Photo.objects.filter()
    serializer_class = PhotoCaptionSerializer
    permission_classes = [AllowAny]


@method_decorator(csrf_exempt, name='dispatch')
class TagListView(generics.ListCreateAPIView):
    """
    List all tags or create a new tag.
    
    GET: Returns all tags with photo counts
    POST: Create a new tag
    """
    queryset = Tag.objects.all().prefetch_related('photos')
    serializer_class = TagSerializer
    ordering = ['name']
    permission_classes = [AllowAny]


@method_decorator(csrf_exempt, name='dispatch')
class TagDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific tag.
    """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [AllowAny]


class PhotosByTagView(generics.ListAPIView):
    """
    List all photos that have a specific tag.
    """
    serializer_class = PhotoListSerializer
    
    def get_queryset(self):
        tag_id = self.kwargs['tag_id']
        return Photo.objects.filter(
            tags__id=tag_id
        ).prefetch_related('tags')


@api_view(['GET'])
def photo_stats(request):
    """
    Get statistics about the photo collection.
    """
    total_photos = Photo.objects.filter().count()
    total_tags = Tag.objects.count()
    
    # Get camera statistics
    camera_stats = Photo.objects.filter(
        camera_name__isnull=False
    ).values('camera_name').distinct().count()
    
    # Get lens statistics
    lens_stats = Photo.objects.filter(
        lens_name__isnull=False
    ).values('lens_name').distinct().count()
    
    # Get recent photos count (last 30 days)
    from django.utils import timezone
    from datetime import timedelta
    thirty_days_ago = timezone.now() - timedelta(days=30)
    recent_photos = Photo.objects.filter(
        date_added__gte=thirty_days_ago
    ).count()
    
    return Response({
        'total_photos': total_photos,
        'total_tags': total_tags,
        'unique_cameras': camera_stats,
        'unique_lenses': lens_stats,
        'recent_photos': recent_photos,
    })


@api_view(['GET'])
def search_photos(request):
    """
    Advanced search endpoint for photos.
    
    Query parameters:
    - q: Search query (searches in file names, captions, camera, lens)
    - tags: Comma-separated list of tag names
    - camera: Camera name filter
    - lens: Lens name filter
    - date_from: Filter photos from this date (YYYY-MM-DD)
    - date_to: Filter photos to this date (YYYY-MM-DD)
    """
    queryset = Photo.objects.filter().prefetch_related('tags')
    
    # Text search
    query = request.query_params.get('q', None)
    if query:
        queryset = queryset.filter(
            Q(file_name__icontains=query) |
            Q(caption__icontains=query) |
            Q(camera_name__icontains=query) |
            Q(lens_name__icontains=query)
        )
    
    # Tag filter
    tags = request.query_params.get('tags', None)
    if tags:
        tag_list = [tag.strip().lower() for tag in tags.split(',')]
        queryset = queryset.filter(tags__name__in=tag_list).distinct()
    
    # Camera filter
    camera = request.query_params.get('camera', None)
    if camera:
        queryset = queryset.filter(camera_name__icontains=camera)
    
    # Lens filter
    lens = request.query_params.get('lens', None)
    if lens:
        queryset = queryset.filter(lens_name__icontains=lens)
    
    # Date range filter
    date_from = request.query_params.get('date_from', None)
    date_to = request.query_params.get('date_to', None)
    
    if date_from:
        try:
            from datetime import datetime
            date_from_obj = datetime.strptime(date_from, '%Y-%m-%d').date()
            queryset = queryset.filter(date_captured__date__gte=date_from_obj)
        except ValueError:
            pass
    
    if date_to:
        try:
            from datetime import datetime
            date_to_obj = datetime.strptime(date_to, '%Y-%m-%d').date()
            queryset = queryset.filter(date_captured__date__lte=date_to_obj)
        except ValueError:
            pass
    
    # Pagination
    from rest_framework.pagination import PageNumberPagination
    paginator = PageNumberPagination()
    paginator.page_size = 20
    
    page = paginator.paginate_queryset(queryset, request)
    if page is not None:
        serializer = PhotoListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    serializer = PhotoListSerializer(queryset, many=True)
    return Response(serializer.data)


class PhotoScanLogListView(generics.ListAPIView):
    """
    List photo scan logs to track image folder scanning history.
    """
    queryset = PhotoScanLog.objects.all()
    serializer_class = PhotoScanLogSerializer
    ordering = ['-scan_date']
