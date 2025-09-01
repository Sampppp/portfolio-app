## MEDIA_URL vs PHOTOS_PATH: Different Purposes

**MEDIA_URL = '/media/'** - This is a **URL path prefix** used for web requests
- It defines the URL pattern that browsers use to request media files
- When a photo is accessed via the web API, it gets a URL like `/media/subfolder/photo.jpg`
- This is what appears in the `image_url` field in the API responses (see serializers.py)
- It's used by Django's static file serving mechanism during development

**PHOTOS_PATH** - This is a **filesystem directory path** where images are physically stored
- It defines where the actual image files exist on the server's file system
- Default value is `/app/images` (likely a Docker container path)
- This is used by the photo scanning management command to find and process image files
- It's the physical storage location, not a web-accessible URL

## How They Work Together

1. **File Storage**: Images are stored in the directory specified by `PHOTOS_PATH` (`/app/images`)

2. **Database Storage**: The `Photo` model stores relative file paths in the `file_path` field

3. **URL Generation**: When the API serves photo data, the serializers combine `MEDIA_URL` with the relative `file_path` to create web-accessible URLs like `/media/subfolder/photo.jpg`

4. **Web Serving**: Django's URL configuration maps requests to `/media/` to serve files from `MEDIA_ROOT` (which is set to `PHOTOS_PATH`)

## Why This Separation Matters

- **Flexibility**: You can change where files are stored (`PHOTOS_PATH`) without changing the URL structure (`MEDIA_URL`)
- **Security**: The web URL structure is independent of the actual filesystem structure
- **Deployment**: Different environments can have different storage paths while maintaining consistent URLs
- **CDN Integration**: In production, `MEDIA_URL` could point to a CDN while `PHOTOS_PATH` remains local

This is a standard Django pattern that separates the concerns of file storage (filesystem) from file access (web URLs).