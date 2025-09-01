// StackFolio Service Worker
// Provides caching for thumbnails and API responses

const CACHE_NAME = 'stackfolio-v1';
const THUMBNAIL_CACHE = 'stackfolio-thumbnails-v1';
const API_CACHE = 'stackfolio-api-v1';

// Resources to cache immediately
const STATIC_RESOURCES = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js'
];

// Install event - cache static resources
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching static resources');
                return cache.addAll(STATIC_RESOURCES);
            })
            .then(() => {
                console.log('Service Worker: Static resources cached');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker: Failed to cache static resources', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME && 
                            cacheName !== THUMBNAIL_CACHE && 
                            cacheName !== API_CACHE) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - handle requests with caching strategy
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Handle thumbnail images with cache-first strategy
    if (url.pathname.includes('/media/thumbnails/')) {
        event.respondWith(
            caches.open(THUMBNAIL_CACHE)
                .then(cache => {
                    return cache.match(event.request)
                        .then(response => {
                            if (response) {
                                console.log('Service Worker: Serving thumbnail from cache', url.pathname);
                                return response;
                            }
                            
                            // Fetch and cache thumbnail
                            return fetch(event.request)
                                .then(fetchResponse => {
                                    if (fetchResponse.ok) {
                                        console.log('Service Worker: Caching thumbnail', url.pathname);
                                        cache.put(event.request, fetchResponse.clone());
                                    }
                                    return fetchResponse;
                                })
                                .catch(error => {
                                    console.error('Service Worker: Failed to fetch thumbnail', error);
                                    // Return a placeholder or empty response
                                    return new Response('', { status: 404 });
                                });
                        });
                })
        );
        return;
    }
    
    // Handle API requests with network-first strategy (with short cache)
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            caches.open(API_CACHE)
                .then(cache => {
                    return fetch(event.request)
                        .then(response => {
                            if (response.ok && event.request.method === 'GET') {
                                // Cache GET API responses for 5 minutes
                                const responseClone = response.clone();
                                const headers = new Headers(responseClone.headers);
                                headers.set('sw-cached-at', Date.now().toString());
                                
                                const cachedResponse = new Response(responseClone.body, {
                                    status: responseClone.status,
                                    statusText: responseClone.statusText,
                                    headers: headers
                                });
                                
                                cache.put(event.request, cachedResponse);
                                console.log('Service Worker: Cached API response', url.pathname);
                            }
                            return response;
                        })
                        .catch(error => {
                            console.log('Service Worker: Network failed, trying cache', url.pathname);
                            return cache.match(event.request)
                                .then(cachedResponse => {
                                    if (cachedResponse) {
                                        const cachedAt = cachedResponse.headers.get('sw-cached-at');
                                        const age = Date.now() - parseInt(cachedAt || '0');
                                        
                                        // Use cached response if less than 5 minutes old
                                        if (age < 5 * 60 * 1000) {
                                            console.log('Service Worker: Serving API from cache', url.pathname);
                                            return cachedResponse;
                                        } else {
                                            console.log('Service Worker: Cached API response expired', url.pathname);
                                            cache.delete(event.request);
                                        }
                                    }
                                    
                                    // Return network error if no valid cache
                                    throw error;
                                });
                        });
                })
        );
        return;
    }
    
    // Handle static resources with cache-first strategy
    if (STATIC_RESOURCES.includes(url.pathname) || 
        url.hostname === 'cdn.jsdelivr.net') {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    if (response) {
                        console.log('Service Worker: Serving static resource from cache', url.pathname);
                        return response;
                    }
                    
                    return fetch(event.request)
                        .then(fetchResponse => {
                            if (fetchResponse.ok) {
                                return caches.open(CACHE_NAME)
                                    .then(cache => {
                                        cache.put(event.request, fetchResponse.clone());
                                        return fetchResponse;
                                    });
                            }
                            return fetchResponse;
                        });
                })
        );
        return;
    }
    
    // Default: network-first for everything else
    event.respondWith(fetch(event.request));
});

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

// Utility function to clean up old cache entries
function cleanupCache(cacheName, maxAge = 24 * 60 * 60 * 1000) {
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
                                            console.log('Service Worker: Cleaning up old cache entry', request.url);
                                            return cache.delete(request);
                                        }
                                    }
                                });
                        })
                    );
                });
        });
}

// Periodic cache cleanup
setInterval(() => {
    cleanupCache(API_CACHE, 5 * 60 * 1000); // 5 minutes for API cache
    cleanupCache(THUMBNAIL_CACHE, 24 * 60 * 60 * 1000); // 24 hours for thumbnails
}, 10 * 60 * 1000); // Run every 10 minutes
