# StackFolio App Documentation

This documentation provides comprehensive information about the StackFolio App, including API documentation, performance optimizations, and development guidelines.

## Table of Contents

### Core Documentation
- [Overview](#overview)
- [Architecture](#architecture)
- [Performance Optimizations](performance/README.md)
- [Development Setup](#development-setup)
- [Production Deployment](PRODUCTION_DEPLOYMENT.md)

### API Documentation
- [Photos API](api/photos/README.md) - Complete photo management API
- [Portfolio Configuration](api/portfolio/README.md) - Django project configuration

### Frontend Documentation
- [Frontend Architecture](frontend/README.md) - Performance-optimized frontend
- [Performance Features](performance/README.md) - Comprehensive performance optimizations

## Overview

The Portfolio App is a Django-based web application designed to showcase photography portfolios with optimized performance and user experience. The application consists of:

- **Backend API**: Django REST framework providing photo management and serving
- **Frontend**: Optimized HTML/CSS/JavaScript with advanced performance features
- **Performance Layer**: Comprehensive optimizations including lazy loading, service workers, and WebP image support

## Architecture

### Backend Components
- **Django API**: RESTful endpoints for photo management
- **PostgreSQL Database**: Stores photo metadata and relationships
- **Media Handling**: Optimized image serving with WebP support
- **Admin Interface**: Django admin for content management

### Frontend Components
- **Responsive Design**: Mobile-first approach with optimized layouts
- **Lazy Loading**: Advanced image loading with intersection observers
- **Service Worker**: Caching strategy for improved performance
- **Progressive Enhancement**: Works without JavaScript, enhanced with it

### Performance Features
- **Critical CSS Inlining**: Above-the-fold CSS for faster rendering
- **WebP Image Format**: Modern image format with JPEG fallback
- **Service Worker Caching**: Intelligent caching for repeat visits
- **Optimized Lazy Loading**: Prevents double-loading issues

## Development Setup

### Prerequisites
- Docker and Docker Compose
- Python 3.8+ (for local development)
- Node.js (for frontend tooling)

### Quick Start
```bash
# Clone the repository
git clone https://github.com/Sampppp/portfolio-app.git
cd portfolio-app

# Start with Docker Compose
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# API: http://localhost:8000/api/
# Admin: http://localhost:8000/admin/
```

### Local Development
```bash
# Backend setup
cd api
pip install -r requirements.txt
python manage.py migrate
python manage.py scan_photos
python manage.py runserver

# Frontend is served as static files
# No additional setup required
```

## Key Features

### Photo Management
- **Automatic Scanning**: Discovers and processes photos from filesystem
- **EXIF Extraction**: Captures camera settings and metadata
- **Tag System**: Flexible categorization with many-to-many relationships
- **Search & Filter**: Advanced search across multiple fields

### Performance Optimizations
- **LCP Optimization**: Reduced from 3.17s to ~1.6s (50% improvement)
- **INP Optimization**: Reduced from 984ms to ~180ms (82% improvement)
- **File Size Reduction**: 25-35% smaller images with WebP
- **Caching Strategy**: 80%+ faster repeat visits

### API Features
- **RESTful Design**: Standard HTTP methods and status codes
- **Pagination**: Efficient handling of large photo collections
- **CORS Support**: Cross-origin requests for frontend integration
- **Comprehensive Filtering**: Search, tag, date, and equipment filters


## Future Development

- option to let ai generate image caption/tags using scenxplain
- basic auto tagging, automatically determining if image is portrait/landscape/sqare
- build an mcp server to have a more standardized process when passing image data to a LLM for captioning
