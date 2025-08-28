"""
Django settings for portfolio project.
"""

from pathlib import Path
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'. Establish root dir
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-your-secret-key-here-change-in-production'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

# allows requests from any domain (overly permissive for production)
ALLOWED_HOSTS = ['*'] 


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin', # standard django apps
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework', # REST Framework for building APIs
    'corsheaders', # Cross-Origin Resource Sharing for frontend communication
    'photos', # custom app for managing photos
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware', # CORS requests
    'django.middleware.security.SecurityMiddleware', # Standard Django middleware for security, sessions, CSRF protection, etc.
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'portfolio.urls' # main URL configuration, urls.py acts as the "routing table" for the project


TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'portfolio.wsgi.application' # creates the bridge between the web server and Django application


# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql', # Uses PostgreSQL instead default SQLite
        'NAME': os.environ.get('POSTGRES_DB', 'photos'), # Reads connection details from environment variables with fallback defaults
        'USER': os.environ.get('POSTGRES_USER', 'portfolio'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'strongpassword'),
        'HOST': os.environ.get('POSTGRES_HOST', 'localhost'),
        'PORT': '5432',
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = 'en-us'     # Default language for your app
TIME_ZONE = 'UTC'           # Default timezone for storing dates/times
USE_I18N = True            # Enable internationalization (translation support)
USE_TZ = True              # Enable timezone-aware datetime handling


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.environ.get('PHOTOS_PATH', os.path.join(BASE_DIR, 'media'))

# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField' # sets the default primary key type for the database model

# REST Framework settings
REST_FRAMEWORK = { # REST Framework with JSON rendering and pagination (20 items per page)
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}

# CORS settings for frontend
CORS_ALLOWED_ORIGINS = [ # allow requests from frontend
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

CORS_ALLOW_ALL_ORIGINS = True  # allows any origin (development only)

PHOTOS_PATH = os.environ.get('PHOTOS_PATH', '/app/images')