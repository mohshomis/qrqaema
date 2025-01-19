const CACHE_NAME = 'restaurant-cache-v1';
const IMAGE_CACHE_NAME = 'restaurant-images-v1';

// Cache images for 7 days
const IMAGE_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME),
      caches.open(IMAGE_CACHE_NAME)
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle image requests
  if (event.request.destination === 'image') {
    event.respondWith(handleImageFetch(event.request));
    return;
  }

  // For other requests, use network first strategy
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});

async function handleImageFetch(request) {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  
  // Try to get from cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    // Check if cache is still valid
    const cachedTime = new Date(cachedResponse.headers.get('sw-cache-time'));
    if (Date.now() - cachedTime.getTime() < IMAGE_CACHE_DURATION) {
      return cachedResponse;
    }
  }

  // If not in cache or expired, fetch from network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const clonedResponse = networkResponse.clone();
      
      // Add cache time header
      const headers = new Headers(clonedResponse.headers);
      headers.append('sw-cache-time', new Date().toUTCString());
      
      const responseToCache = new Response(await clonedResponse.blob(), {
        status: clonedResponse.status,
        statusText: clonedResponse.statusText,
        headers: headers
      });
      
      // Store in cache
      cache.put(request, responseToCache);
    }
    return networkResponse;
  } catch (error) {
    // If network fails and we have a cached version (even if expired), use it
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys => {
        return Promise.all(
          keys.map(key => {
            if (key !== CACHE_NAME && key !== IMAGE_CACHE_NAME) {
              return caches.delete(key);
            }
          })
        );
      }),
      // Clean up expired images
      cleanExpiredImages()
    ])
  );
});

async function cleanExpiredImages() {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  const requests = await cache.keys();
  
  return Promise.all(
    requests.map(async (request) => {
      const response = await cache.match(request);
      const cachedTime = new Date(response.headers.get('sw-cache-time'));
      
      if (Date.now() - cachedTime.getTime() > IMAGE_CACHE_DURATION) {
        return cache.delete(request);
      }
    })
  );
}
