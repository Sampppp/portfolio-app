// Photo Portfolio API Tester JavaScript

// Global variables
let currentPhotoId = null;
let allTags = [];

// API Base URL (will be proxied through nginx)
const API_BASE = '/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    checkApiStatus();
    loadPhotos();
    loadTags();
});

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
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('d-none');
    });
    
    // Show selected section
    document.getElementById(`${sectionName}-section`).classList.remove('d-none');
    
    // Update navbar
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
    
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
async function loadPhotos(params = {}) {
    const loadingElement = document.getElementById('photos-loading');
    const gridElement = document.getElementById('photos-grid');
    
    loadingElement.classList.remove('d-none');
    gridElement.innerHTML = '';
    
    try {
        const queryParams = new URLSearchParams(params);
        const response = await fetch(`${API_BASE}/photos/?${queryParams}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        displayPhotos(data.results || data);
        showToast(`Loaded ${(data.results || data).length} photos`, 'success');
    } catch (error) {
        showToast(`Error loading photos: ${error.message}`, 'error');
        gridElement.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle"></i>
                    Error loading photos: ${error.message}
                </div>
            </div>
        `;
    } finally {
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
    
    gridElement.innerHTML = photos.map(photo => `
        <div class="col-md-4 col-lg-3 mb-4">
            <div class="card photo-card" onclick="showPhotoDetail(${photo.id})">
                ${photo.image_url ? `
                    <img src="${photo.image_url}" alt="${photo.file_name}" class="photo-thumbnail" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="photo-placeholder" style="display: none;">
                        <i class="bi bi-image"></i>
                    </div>
                ` : `
                    <div class="photo-placeholder">
                        <i class="bi bi-image"></i>
                    </div>
                `}
                <div class="card-body">
                    <h6 class="card-title text-truncate">${photo.file_name}</h6>
                    <div class="metadata-item">
                        <strong>Size:</strong> ${formatFileSize(photo.file_size)}
                    </div>
                    ${photo.camera_name ? `
                        <div class="metadata-item">
                            <strong>Camera:</strong> ${photo.camera_name}
                        </div>
                    ` : ''}
                    ${photo.date_captured ? `
                        <div class="metadata-item">
                            <strong>Captured:</strong> ${formatDate(photo.date_captured)}
                        </div>
                    ` : ''}
                    <div class="mt-2">
                        ${photo.tags.map(tag => `
                            <span class="badge bg-secondary tag-badge">${tag.name}</span>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
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
    
    loadPhotos(params);
}

// Photo Detail Functions
async function showPhotoDetail(photoId) {
    currentPhotoId = photoId;
    
    try {
        const response = await fetch(`${API_BASE}/photos/${photoId}/`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const photo = await response.json();
        displayPhotoDetail(photo);
        
        const modal = new bootstrap.Modal(document.getElementById('photoModal'));
        modal.show();
    } catch (error) {
        showToast(`Error loading photo details: ${error.message}`, 'error');
    }
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
                
                <div class="form-check mb-3">
                    <input class="form-check-input" type="checkbox" id="photo-public" 
                           ${photo.is_public ? 'checked' : ''}>
                    <label class="form-check-label" for="photo-public">
                        Public Photo
                    </label>
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
    const isPublic = document.getElementById('photo-public').checked;
    
    // Parse tags
    const tagNames = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    try {
        // Update photo
        const updateData = {
            caption: caption,
            is_public: isPublic,
            tags: tagNames
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
        
        const tags = await response.json();
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
                <small class="text-muted ms-2">Created: ${formatDate(tag.created_at)}</small>
            </div>
            <div class="tag-actions">
                <button class="btn btn-sm btn-outline-primary" onclick="viewTagPhotos(${tag.id})">
                    <i class="bi bi-images"></i> Photos
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
        
        const photos = await response.json();
        
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
