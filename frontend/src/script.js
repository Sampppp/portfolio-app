// StackFolio JavaScript

// Global variables
let currentPhotoId = null;
let allTags = [];
let currentPage = 1;
let isLoading = false;
let hasMorePhotos = true;
let currentFilters = {};

// API Base URL (will be proxied through nginx)
const API_BASE = '/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    checkApiStatus();
    loadPhotos();
    loadTags();
    setupInfiniteScroll();
    setupLazyLoading();
    registerServiceWorker();
});

// Service Worker Registration
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered successfully:', registration);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker available
                            console.log('New service worker available');
                            showToast('App updated! Refresh to get the latest version.', 'info');
                        }
                    });
                });
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }
}

// Utility Functions
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastBody = document.getElementById('toast-body');
    
    toastBody.innerHTML = message;
    toast.className = `toast ${type === 'error' ? 'bg-danger text-white' : type === 'success' ? 'bg-success text-white' : ''}`;
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
}

function formatFileSize(bytes) {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// Section Navigation
function showSection(sectionName, event) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('d-none');
    });
    
    // Show selected section
    document.getElementById(`${sectionName}-section`).classList.remove('d-none');
    
    // Update navbar only if event is provided (clicked from nav)
    if (event && event.target) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        event.target.classList.add('active');
    }
    
    // Load data for specific sections
    switch(sectionName) {
        case 'tags':
            loadTags();
            break;
        case 'stats':
            loadStats();
            break;
        case 'logs':
            loadScanLogs();
            break;
    }
}

// API Status Check
async function checkApiStatus() {
    const statusElement = document.getElementById('api-status');
    
    try {
        const response = await fetch(`${API_BASE}/photos/stats/`);
        if (response.ok) {
            statusElement.innerHTML = `
                <i class="bi bi-check-circle-fill api-status-success me-2"></i>
                <span>API Connected Successfully</span>
            `;
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        statusElement.innerHTML = `
            <i class="bi bi-x-circle-fill api-status-error me-2"></i>
            <span>API Connection Failed: ${error.message}</span>
        `;
    }
}

// Photos Functions
async function loadPhotos(params = {}, reset = true) {
    if (isLoading) return;
    
    const loadingElement = document.getElementById('photos-loading');
    const gridElement = document.getElementById('photos-grid');
    
    if (reset) {
        currentPage = 1;
        hasMorePhotos = true;
        currentFilters = params;
        gridElement.innerHTML = '';
    }
    
    isLoading = true;
    loadingElement.classList.remove('d-none');
    
    try {
        const queryParams = new URLSearchParams({
            ...params,
            page: currentPage,
            page_size: 20
        });
        
        const response = await fetch(`${API_BASE}/photos/?${queryParams}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        const photos = data.results || data;
        
        if (reset) {
            displayPhotos(photos);
            showToast(`Loaded ${photos.length} photos`, 'success');
        } else {
            appendPhotos(photos);
        }
        
        // Check if there are more photos to load
        if (data.next) {
            hasMorePhotos = true;
            currentPage++;
        } else {
            hasMorePhotos = false;
        }
        
    } catch (error) {
        showToast(`Error loading photos: ${error.message}`, 'error');
        if (reset) {
            gridElement.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle"></i>
                        Error loading photos: ${error.message}
                    </div>
                </div>
            `;
        }
    } finally {
        isLoading = false;
        loadingElement.classList.add('d-none');
    }
}

function displayPhotos(photos) {
    const gridElement = document.getElementById('photos-grid');
    
    if (photos.length === 0) {
        gridElement.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i>
                    No photos found.
                </div>
            </div>
        `;
        return;
    }
    
    gridElement.innerHTML = photos.map(photo => createPhotoCard(photo)).join('');
}

function appendPhotos(photos) {
    const gridElement = document.getElementById('photos-grid');
    const newPhotosHTML = photos.map(photo => createPhotoCard(photo)).join('');
    gridElement.insertAdjacentHTML('beforeend', newPhotosHTML);
}

function createPhotoCard(photo) {
    // Use WebP with JPEG fallback for optimal performance
    const webpUrl = photo.thumbnail_webp_url;
    const jpegUrl = photo.thumbnail_jpeg_url;
    const fallbackUrl = photo.thumbnail_url || photo.image_url;
    
    return `
        <div class="col-md-4 col-lg-3 mb-4">
            <div class="photo-card-clean" onclick="showPhotoDetail(${photo.id})" data-photo-id="${photo.id}">
                ${webpUrl || jpegUrl || fallbackUrl ? `
                    <picture>
                        ${webpUrl ? `<source data-srcset="${webpUrl}" type="image/webp">` : ''}
                        <img alt="${photo.file_name}" class="photo-thumbnail-clean lazy-image" 
                             data-src="${jpegUrl || fallbackUrl}"
                             width="300" height="250"
                             style="background-color: #f8f9fa;"
                             onerror="this.style.display='none'; this.closest('.photo-card-clean').querySelector('.photo-placeholder-clean').style.display='flex';">
                    </picture>
                    <div class="photo-placeholder-clean" style="display: none;">
                        <i class="bi bi-image"></i>
                    </div>
                ` : `
                    <div class="photo-placeholder-clean">
                        <i class="bi bi-image"></i>
                    </div>
                `}
                <div class="photo-loading-overlay">
                    <div class="spinner-border spinner-border-sm text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function applyPhotoFilters() {
    const params = {};
    
    const camera = document.getElementById('camera-filter').value.trim();
    const lens = document.getElementById('lens-filter').value.trim();
    const tags = document.getElementById('tags-filter').value.trim();
    const ordering = document.getElementById('order-by').value;
    
    if (camera) params.camera = camera;
    if (lens) params.lens = lens;
    if (tags) params.tags = tags;
    if (ordering) params.ordering = ordering;
    
    loadPhotos(params, true);
}

// Infinite Scroll Setup
function setupInfiniteScroll() {
    window.addEventListener('scroll', () => {
        // Only trigger on photos section
        const photosSection = document.getElementById('photos-section');
        if (photosSection.classList.contains('d-none')) return;
        
        // Check if we're near the bottom of the page
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 1000) {
            if (hasMorePhotos && !isLoading) {
                loadPhotos(currentFilters, false);
            }
        }
    });
}

// Photo Detail Functions
let modalLoadingTimeout = null;

async function showPhotoDetail(photoId) {
    // Debounce rapid clicks
    if (modalLoadingTimeout) {
        clearTimeout(modalLoadingTimeout);
    }
    
    currentPhotoId = photoId;
    
    // Show modal immediately with loading state
    const modal = new bootstrap.Modal(document.getElementById('photoModal'));
    const modalBody = document.getElementById('photo-modal-body');
    
    modalBody.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading photo details...</span>
            </div>
            <p class="mt-3">Loading photo details...</p>
        </div>
    `;
    
    modal.show();
    
    modalLoadingTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`${API_BASE}/photos/${photoId}/`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const photo = await response.json();
            displayPhotoDetail(photo);
        } catch (error) {
            modalBody.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle"></i>
                    Error loading photo details: ${error.message}
                </div>
            `;
            showToast(`Error loading photo details: ${error.message}`, 'error');
        }
    }, 50); // Small delay to prevent rapid API calls
}

function displayPhotoDetail(photo) {
    const modalBody = document.getElementById('photo-modal-body');
    
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                ${photo.image_url ? `
                    <img src="${photo.image_url}" alt="${photo.file_name}" class="photo-detail-image" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="photo-placeholder mb-3" style="display: none;">
                        <i class="bi bi-image"></i>
                    </div>
                ` : `
                    <div class="photo-placeholder mb-3">
                        <i class="bi bi-image"></i>
                    </div>
                `}
            </div>
            <div class="col-md-6">
                <h5>${photo.file_name}</h5>
                
                <div class="mb-3">
                    <label class="form-label">Caption:</label>
                    <textarea class="form-control" id="photo-caption" rows="3">${photo.caption || ''}</textarea>
                </div>
                
                <div class="mb-3">
                    <label class="form-label">Tags:</label>
                    <input type="text" class="form-control" id="photo-tags" 
                           value="${photo.tags.map(tag => tag.name).join(', ')}"
                           placeholder="tag1, tag2, tag3">
                </div>
            </div>
        </div>
        
        <div class="metadata-grid">
            <div class="metadata-card">
                <h6>File Information</h6>
                <div><strong>Path:</strong> ${photo.file_path}</div>
                <div><strong>Size:</strong> ${formatFileSize(photo.file_size)}</div>
                <div><strong>Extension:</strong> ${photo.file_extension || 'N/A'}</div>
            </div>
            
            <div class="metadata-card">
                <h6>Camera Settings</h6>
                <div><strong>Camera:</strong> ${photo.camera_name || 'N/A'}</div>
                <div><strong>Lens:</strong> ${photo.lens_name || 'N/A'}</div>
                <div><strong>Focal Length:</strong> ${photo.focal_length ? photo.focal_length + 'mm' : 'N/A'}</div>
                <div><strong>Aperture:</strong> ${photo.aperture || 'N/A'}</div>
                <div><strong>Shutter Speed:</strong> ${photo.shutter_speed || 'N/A'}</div>
                <div><strong>ISO:</strong> ${photo.iso || 'N/A'}</div>
            </div>
            
            <div class="metadata-card">
                <h6>Resolution</h6>
                <div><strong>Dimensions:</strong> ${photo.resolution_string || 'N/A'}</div>
                <div><strong>Width:</strong> ${photo.resolution_width || 'N/A'}</div>
                <div><strong>Height:</strong> ${photo.resolution_height || 'N/A'}</div>
            </div>
            
            <div class="metadata-card">
                <h6>Dates</h6>
                <div><strong>Captured:</strong> ${formatDate(photo.date_captured)}</div>
                <div><strong>Added:</strong> ${formatDate(photo.date_added)}</div>
                <div><strong>Modified:</strong> ${formatDate(photo.date_modified)}</div>
            </div>
        </div>
    `;
}

async function savePhotoChanges() {
    if (!currentPhotoId) return;
    
    const caption = document.getElementById('photo-caption').value;
    const tagsInput = document.getElementById('photo-tags').value;
    
    // Parse tags
    const tagNames = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    try {
        // Update photo - backend expects 'tag_names' not 'tags'
        const updateData = {
            caption: caption,
            tag_names: tagNames
        };
        
        const response = await fetch(`${API_BASE}/photos/${currentPhotoId}/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        showToast('Photo updated successfully!', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('photoModal'));
        modal.hide();
        
        // Refresh photos
        loadPhotos();
        
    } catch (error) {
        showToast(`Error updating photo: ${error.message}`, 'error');
    }
}

// Search Functions
async function performSearch() {
    const loadingElement = document.getElementById('search-loading');
    const resultsElement = document.getElementById('search-results');
    
    loadingElement.classList.remove('d-none');
    resultsElement.innerHTML = '';
    
    const params = {};
    
    const query = document.getElementById('search-query').value.trim();
    const tags = document.getElementById('search-tags').value.trim();
    const camera = document.getElementById('search-camera').value.trim();
    const lens = document.getElementById('search-lens').value.trim();
    const dateFrom = document.getElementById('search-date-from').value;
    const dateTo = document.getElementById('search-date-to').value;
    
    if (query) params.q = query;
    if (tags) params.tags = tags;
    if (camera) params.camera = camera;
    if (lens) params.lens = lens;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    
    try {
        const queryParams = new URLSearchParams(params);
        const response = await fetch(`${API_BASE}/photos/search/?${queryParams}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        displaySearchResults(data.results || data);
        showToast(`Found ${(data.results || data).length} photos`, 'success');
    } catch (error) {
        showToast(`Search error: ${error.message}`, 'error');
        resultsElement.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i>
                Search error: ${error.message}
            </div>
        `;
    } finally {
        loadingElement.classList.add('d-none');
    }
}

function displaySearchResults(photos) {
    const resultsElement = document.getElementById('search-results');
    
    if (photos.length === 0) {
        resultsElement.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle"></i>
                No photos found matching your search criteria.
            </div>
        `;
        return;
    }
    
    resultsElement.innerHTML = `
        <h6>Search Results (${photos.length} photos)</h6>
        ${photos.map(photo => `
            <div class="search-result-item" onclick="showPhotoDetail(${photo.id})">
                <div class="row">
                    <div class="col-md-2">
                        <div class="photo-placeholder" style="height: 80px;">
                            <i class="bi bi-image"></i>
                        </div>
                    </div>
                    <div class="col-md-10">
                        <h6>${photo.file_name}</h6>
                        <div class="row">
                            <div class="col-md-6">
                                <small class="text-muted">
                                    ${photo.camera_name ? `Camera: ${photo.camera_name}<br>` : ''}
                                    ${photo.lens_name ? `Lens: ${photo.lens_name}<br>` : ''}
                                    Size: ${formatFileSize(photo.file_size)}
                                </small>
                            </div>
                            <div class="col-md-6">
                                <small class="text-muted">
                                    ${photo.date_captured ? `Captured: ${formatDate(photo.date_captured)}<br>` : ''}
                                    ${photo.caption ? `Caption: ${photo.caption.substring(0, 100)}${photo.caption.length > 100 ? '...' : ''}` : ''}
                                </small>
                            </div>
                        </div>
                        <div class="mt-2">
                            ${photo.tags.map(tag => `
                                <span class="badge bg-secondary tag-badge">${tag.name}</span>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `).join('')}
    `;
}

// Tags Functions
async function loadTags() {
    const loadingElement = document.getElementById('tags-loading');
    const listElement = document.getElementById('tags-list');
    
    loadingElement.classList.remove('d-none');
    listElement.innerHTML = '';
    
    try {
        const response = await fetch(`${API_BASE}/tags/`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        // Handle both paginated and direct array responses
        const tags = data.results || data;
        allTags = tags;
        displayTags(tags);
        showToast(`Loaded ${tags.length} tags`, 'success');
    } catch (error) {
        showToast(`Error loading tags: ${error.message}`, 'error');
        listElement.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i>
                Error loading tags: ${error.message}
            </div>
        `;
    } finally {
        loadingElement.classList.add('d-none');
    }
}

function displayTags(tags) {
    const listElement = document.getElementById('tags-list');
    
    if (tags.length === 0) {
        listElement.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle"></i>
                No tags found.
            </div>
        `;
        return;
    }
    
    listElement.innerHTML = tags.map(tag => `
        <div class="tag-item">
            <div class="flex-grow-1">
                <strong>${tag.name}</strong>
                <small class="text-muted ms-2">${tag.photo_count} photo${tag.photo_count !== 1 ? 's' : ''}</small>
            </div>
            <div class="tag-actions">
                <button class="btn btn-sm btn-outline-primary" onclick="viewTagPhotos(${tag.id})">
                    <i class="bi bi-images"></i> View Photos (${tag.photo_count})
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteTag(${tag.id})">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function showCreateTagForm() {
    document.getElementById('create-tag-form').classList.remove('d-none');
    document.getElementById('new-tag-name').focus();
}

function hideCreateTagForm() {
    document.getElementById('create-tag-form').classList.add('d-none');
    document.getElementById('new-tag-name').value = '';
}

async function createTag() {
    const tagName = document.getElementById('new-tag-name').value.trim();
    
    if (!tagName) {
        showToast('Please enter a tag name', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/tags/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: tagName })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        showToast('Tag created successfully!', 'success');
        hideCreateTagForm();
        loadTags();
    } catch (error) {
        showToast(`Error creating tag: ${error.message}`, 'error');
    }
}

async function deleteTag(tagId) {
    if (!confirm('Are you sure you want to delete this tag?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/tags/${tagId}/`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        showToast('Tag deleted successfully!', 'success');
        loadTags();
    } catch (error) {
        showToast(`Error deleting tag: ${error.message}`, 'error');
    }
}

async function viewTagPhotos(tagId) {
    try {
        const response = await fetch(`${API_BASE}/tags/${tagId}/photos/`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Handle both paginated and direct array responses
        const photos = data.results || data;
        
        // Ensure photos is an array
        if (!Array.isArray(photos)) {
            throw new Error('Invalid response format: expected array of photos');
        }
        
        // Switch to photos section and display results
        showSection('photos');
        displayPhotos(photos);
        showToast(`Showing ${photos.length} photos for this tag`, 'success');
    } catch (error) {
        showToast(`Error loading tag photos: ${error.message}`, 'error');
    }
}

// Statistics Functions
async function loadStats() {
    const loadingElement = document.getElementById('stats-loading');
    const contentElement = document.getElementById('stats-content');
    
    loadingElement.classList.remove('d-none');
    contentElement.innerHTML = '';
    
    try {
        const response = await fetch(`${API_BASE}/photos/stats/`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const stats = await response.json();
        displayStats(stats);
        showToast('Statistics loaded successfully', 'success');
    } catch (error) {
        showToast(`Error loading statistics: ${error.message}`, 'error');
        contentElement.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i>
                Error loading statistics: ${error.message}
            </div>
        `;
    } finally {
        loadingElement.classList.add('d-none');
    }
}

function displayStats(stats) {
    const contentElement = document.getElementById('stats-content');
    
    contentElement.innerHTML = `
        <div class="row">
            <div class="col-md-6 col-lg-3">
                <div class="stats-card">
                    <div class="stats-number">${stats.total_photos}</div>
                    <div class="stats-label">Total Photos</div>
                </div>
            </div>
            <div class="col-md-6 col-lg-3">
                <div class="stats-card">
                    <div class="stats-number">${stats.total_tags}</div>
                    <div class="stats-label">Total Tags</div>
                </div>
            </div>
            <div class="col-md-6 col-lg-3">
                <div class="stats-card">
                    <div class="stats-number">${stats.unique_cameras}</div>
                    <div class="stats-label">Unique Cameras</div>
                </div>
            </div>
            <div class="col-md-6 col-lg-3">
                <div class="stats-card">
                    <div class="stats-number">${stats.unique_lenses}</div>
                    <div class="stats-label">Unique Lenses</div>
                </div>
            </div>
        </div>
        <div class="row mt-4">
            <div class="col-md-6">
                <div class="stats-card">
                    <div class="stats-number">${stats.recent_photos}</div>
                    <div class="stats-label">Photos Added (Last 30 Days)</div>
                </div>
            </div>
        </div>
    `;
}

// Scan Logs Functions
async function loadScanLogs() {
    const loadingElement = document.getElementById('logs-loading');
    const contentElement = document.getElementById('logs-content');
    
    loadingElement.classList.remove('d-none');
    contentElement.innerHTML = '';
    
    try {
        const response = await fetch(`${API_BASE}/scan-logs/`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const logs = await response.json();
        displayScanLogs(logs.results || logs);
        showToast(`Loaded ${(logs.results || logs).length} scan logs`, 'success');
    } catch (error) {
        showToast(`Error loading scan logs: ${error.message}`, 'error');
        contentElement.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i>
                Error loading scan logs: ${error.message}
            </div>
        `;
    } finally {
        loadingElement.classList.add('d-none');
    }
}

function displayScanLogs(logs) {
    const contentElement = document.getElementById('logs-content');
    
    if (logs.length === 0) {
        contentElement.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle"></i>
                No scan logs found.
            </div>
        `;
        return;
    }
    
    contentElement.innerHTML = logs.map(log => `
        <div class="log-entry ${log.errors ? 'error' : 'success'}">
            <div class="row">
                <div class="col-md-6">
                    <h6><i class="bi bi-calendar"></i> ${formatDate(log.scan_date)}</h6>
                    <p class="mb-1"><strong>Duration:</strong> ${log.scan_duration.toFixed(2)} seconds</p>
                </div>
                <div class="col-md-6">
                    <p class="mb-1"><strong>Photos Found:</strong> ${log.photos_found}</p>
                    <p class="mb-1"><strong>Photos Added:</strong> ${log.photos_added}</p>
                    <p class="mb-1"><strong>Photos Updated:</strong> ${log.photos_updated}</p>
                </div>
            </div>
            ${log.errors ? `
                <div class="mt-2">
                    <strong class="text-danger">Errors:</strong>
                    <pre class="mt-1 text-danger">${log.errors}</pre>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Lazy Loading Implementation
let imageObserver = null;
let prefetchObserver = null;

function setupLazyLoading() {
    // Check if Intersection Observer is supported
    if ('IntersectionObserver' in window) {
        // Main lazy loading observer
        imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const photoCard = img.closest('.photo-card-clean');
                    const loadingOverlay = photoCard?.querySelector('.photo-loading-overlay');
                    const picture = img.closest('picture');
                    
                    // Load the image with WebP support
                    const src = img.getAttribute('data-src');
                    if (src) {
                        // Handle picture element with WebP sources
                        if (picture) {
                            const webpSource = picture.querySelector('source[data-srcset]');
                            if (webpSource) {
                                const webpSrc = webpSource.getAttribute('data-srcset');
                                webpSource.srcset = webpSrc;
                                webpSource.removeAttribute('data-srcset');
                            }
                        }
                        
                        // Create a new image to preload
                        const newImg = new Image();
                        newImg.onload = () => {
                            img.src = src;
                            img.classList.add('loaded');
                            if (loadingOverlay) {
                                loadingOverlay.style.display = 'none';
                            }
                        };
                        newImg.onerror = () => {
                            if (loadingOverlay) {
                                loadingOverlay.style.display = 'none';
                            }
                            img.style.display = 'none';
                            const placeholder = photoCard?.querySelector('.photo-placeholder-clean');
                            if (placeholder) {
                                placeholder.style.display = 'flex';
                            }
                        };
                        newImg.src = src;
                        img.removeAttribute('data-src');
                    }
                    
                    // Stop observing this image
                    observer.unobserve(img);
                }
            });
        }, {
            // Load images when they're 50px away from entering the viewport
            rootMargin: '50px 0px',
            threshold: 0.01
        });
        
        // Prefetch observer for images further away
        prefetchObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.getAttribute('data-src');
                    if (src) {
                        // Prefetch the image
                        const link = document.createElement('link');
                        link.rel = 'prefetch';
                        link.href = src;
                        document.head.appendChild(link);
                    }
                    observer.unobserve(img);
                }
            });
        }, {
            // Prefetch images when they're 200px away from entering the viewport
            rootMargin: '200px 0px',
            threshold: 0.01
        });
        
        // Observe existing lazy images
        observeLazyImages();
    } else {
        // Fallback for browsers without Intersection Observer
        loadAllImages();
    }
}

function observeLazyImages() {
    const lazyImages = document.querySelectorAll('.lazy-image[data-src]');
    lazyImages.forEach(img => {
        if (imageObserver) {
            imageObserver.observe(img);
        }
        if (prefetchObserver) {
            prefetchObserver.observe(img);
        }
    });
}

function loadAllImages() {
    // Fallback: load all images immediately
    const lazyImages = document.querySelectorAll('.lazy-image[data-src]');
    lazyImages.forEach(img => {
        const src = img.getAttribute('data-src');
        if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            img.classList.add('loaded');
        }
    });
}

// Update displayPhotos and appendPhotos to setup lazy loading for new images
const originalDisplayPhotos = displayPhotos;
const originalAppendPhotos = appendPhotos;

displayPhotos = function(photos) {
    originalDisplayPhotos(photos);
    // Setup lazy loading for new images immediately
    requestAnimationFrame(() => observeLazyImages());
};

appendPhotos = function(photos) {
    originalAppendPhotos(photos);
    // Setup lazy loading for new images immediately
    requestAnimationFrame(() => observeLazyImages());
};
