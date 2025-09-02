// StackFolio Service Worker - Production Version
// Provides optimized caching for production deployment

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAMES = {
  static: `portfolio-static-${CACHE_VERSION}`,
  images: `portfolio-images-${CACHE_VERSION}`,
  api: `portfolio-api-${CACHE_VERSION}`
};

// Production cache strategies
const CACHE_STRATEGIES = {
  static: 'cache-first',
  images: 'cache-first',
  api: 'network-first'
};

// Cache durations (in seconds)
const CACHE_DURATIONS = {
  static: 31536000,  // 1 year
  images: 2592000,   // 30 days
  api: 300           // 5 minutes
};

// Legacy cache names for cleanup
const LEGACY_CACHE_NAMES = ['stackfolio-v1', 'stackfolio-thumbnails-v1', 'stackfolio-api-v1'];

// Resources to cache immediately - Production optimized
const STATIC_RESOURCES = [
    '/',
    '/index.html',
    '/style.min.css',  // Use minified version in production
    '/script.min.js',  // Use minified version in production
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js'
];

// Install event - cache static resources with production optimization
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAMES.static)
            .then(cache => {
                console.log('Service Worker: Caching static resources for production');
                return cache.addAll(STATIC_RESOURCES);
            })
            .then(() => {
                console.log('Service Worker: Static resources cached with version', CACHE_VERSION);
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker: Failed to cache static resources', error);
            })
    );
});

// Activate event - clean up old caches with production versioning
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        // Keep current version caches and delete everything else
                        const isCurrentCache = Object.values(CACHE_NAMES).includes(cacheName);
                        if (!isCurrentCache) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated with cache version', CACHE_VERSION);
                return self.clients.claim();
            })
    );
});

// Production-optimized fetch event with advanced caching strategies
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Handle static files with cache-first strategy (1 year cache)
    if (url.pathname.includes('/static/')) {
        event.respondWith(cacheFirst(event.request, CACHE_NAMES.static));
        return;
    }
    
    // Handle media files (images/thumbnails) with cache-first strategy (30 days cache)
    if (url.pathname.includes('/media/')) {
        event.respondWith(cacheFirst(event.request, CACHE_NAMES.images));
        return;
    }
    
    // Handle API requests with network-first strategy (5 minutes cache)
    if (url.pathname.includes('/api/')) {
        event.respondWith(networkFirst(event.request, CACHE_NAMES.api));
        return;
    }
    
    // Handle CDN resources with cache-first strategy
    if (url.hostname === 'cdn.jsdelivr.net') {
        event.respondWith(cacheFirst(event.request, CACHE_NAMES.static));
        return;
    }
    
    // Handle minified static resources with cache-first strategy
    if (STATIC_RESOURCES.includes(url.pathname) || 
        url.pathname.endsWith('.min.css') || 
        url.pathname.endsWith('.min.js')) {
        event.respondWith(cacheFirst(event.request, CACHE_NAMES.static));
        return;
    }
    
    // Default: network-first for everything else
    event.respondWith(fetch(event.request));
});

// Cache-first strategy implementation
function cacheFirst(request, cacheName) {
    return caches.open(cacheName)
        .then(cache => {
            return cache.match(request)
                .then(response => {
                    if (response) {
                        // Check if cached response is still valid
                        const cachedAt = response.headers.get('sw-cached-at');
                        if (cachedAt) {
                            const age = Date.now() - parseInt(cachedAt);
                            const maxAge = getMaxAge(cacheName);
                            
                            if (age > maxAge) {
                                console.log('Service Worker: Cache expired, fetching fresh', request.url);
                                cache.delete(request);
                                return fetchAndCache(request, cache);
                            }
                        }
                        
                        console.log('Service Worker: Serving from cache', request.url);
                        return response;
                    }
                    
                    return fetchAndCache(request, cache);
                });
        });
}

// Network-first strategy implementation
function networkFirst(request, cacheName) {
    return caches.open(cacheName)
        .then(cache => {
            return fetch(request)
                .then(response => {
                    if (response.ok && request.method === 'GET') {
                        const responseClone = response.clone();
                        const headers = new Headers(responseClone.headers);
                        headers.set('sw-cached-at', Date.now().toString());
                        
                        const cachedResponse = new Response(responseClone.body, {
                            status: responseClone.status,
                            statusText: responseClone.statusText,
                            headers: headers
                        });
                        
                        cache.put(request, cachedResponse);
                        console.log('Service Worker: Cached network response', request.url);
                    }
                    return response;
                })
                .catch(error => {
                    console.log('Service Worker: Network failed, trying cache', request.url);
                    return cache.match(request)
                        .then(cachedResponse => {
                            if (cachedResponse) {
                                const cachedAt = cachedResponse.headers.get('sw-cached-at');
                                const age = Date.now() - parseInt(cachedAt || '0');
                                const maxAge = getMaxAge(cacheName);
                                
                                if (age < maxAge) {
                                    console.log('Service Worker: Serving stale cache due to network error', request.url);
                                    return cachedResponse;
                                } else {
                                    console.log('Service Worker: Cached response expired', request.url);
                                    cache.delete(request);
                                }
                            }
                            
                            throw error;
                        });
                });
        });
}

// Helper function to fetch and cache
function fetchAndCache(request, cache) {
    return fetch(request)
        .then(fetchResponse => {
            if (fetchResponse.ok) {
                const responseClone = fetchResponse.clone();
                const headers = new Headers(responseClone.headers);
                headers.set('sw-cached-at', Date.now().toString());
                
                const cachedResponse = new Response(responseClone.body, {
                    status: responseClone.status,
                    statusText: responseClone.statusText,
                    headers: headers
                });
                
                cache.put(request, cachedResponse);
                console.log('Service Worker: Cached fresh response', request.url);
            }
            return fetchResponse;
        })
        .catch(error => {
            console.error('Service Worker: Failed to fetch', request.url, error);
            return new Response('', { status: 404 });
        });
}

// Get maximum age for cache based on cache name
function getMaxAge(cacheName) {
    if (cacheName.includes('static')) {
        return CACHE_DURATIONS.static * 1000;
    } else if (cacheName.includes('images')) {
        return CACHE_DURATIONS.images * 1000;
    } else if (cacheName.includes('api')) {
        return CACHE_DURATIONS.api * 1000;
    }
    return 24 * 60 * 60 * 1000; // Default 24 hours
}

// Handle background sync for offline functionality
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        console.log('Service Worker: Background sync triggered');
        event.waitUntil(
            // Implement background sync logic here if needed
            Promise.resolve()
        );
    }
});

// Handle push notifications (for future use)
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();
        console.log('Service Worker: Push notification received', data);
        
        event.waitUntil(
            self.registration.showNotification(data.title, {
                body: data.body,
                icon: '/icon-192.png',
                badge: '/badge-72.png'
            })
        );
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/')
    );
});

// Production-optimized cache cleanup utility
function cleanupCache(cacheName, maxAge) {
    return caches.open(cacheName)
        .then(cache => {
            return cache.keys()
                .then(requests => {
                    return Promise.all(
                        requests.map(request => {
                            return cache.match(request)
                                .then(response => {
                                    if (response) {
                                        const cachedAt = response.headers.get('sw-cached-at');
                                        const age = Date.now() - parseInt(cachedAt || '0');
                                        
                                        if (age > maxAge) {
                                            console.log('Service Worker: Cleaning up expired cache entry', request.url);
                                            return cache.delete(request);
                                        }
                                    }
                                });
                        })
                    );
                });
        })
        .catch(error => {
            console.error('Service Worker: Cache cleanup failed for', cacheName, error);
        });
}

// Production cache management with proper intervals
function performCacheCleanup() {
    console.log('Service Worker: Performing scheduled cache cleanup');
    
    // Clean up each cache type with appropriate durations
    Promise.all([
        cleanupCache(CACHE_NAMES.api, CACHE_DURATIONS.api * 1000),
        cleanupCache(CACHE_NAMES.images, CACHE_DURATIONS.images * 1000),
        cleanupCache(CACHE_NAMES.static, CACHE_DURATIONS.static * 1000)
    ]).then(() => {
        console.log('Service Worker: Cache cleanup completed');
    }).catch(error => {
        console.error('Service Worker: Cache cleanup failed', error);
    });
}

// Schedule periodic cache cleanup (every 30 minutes in production)
setInterval(performCacheCleanup, 30 * 60 * 1000);
