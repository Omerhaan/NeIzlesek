// Service Worker for Neİzlesek PWA
const CACHE_NAME = 'neizlesek-v1'

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
]

// Install event: Pre-cache app shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('PWA Precache warning:', err)
      })
    })
  )
  self.skipWaiting()
})

// Activate event: Clean up previous version caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    })
  )
  self.clients.claim()
})

// Fetch event: Network-first for dynamic APIs, Stale-while-revalidate for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Do NOT intercept Supabase WebSocket or Realtime calls
  if (url.pathname.includes('/realtime/') || url.protocol === 'ws:' || url.protocol === 'wss:') {
    return
  }

  // Network-first for Supabase & TMDb API calls
  if (url.hostname.includes('supabase.co') || url.hostname.includes('themoviedb.org')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    )
    return
  }

  // Stale-While-Revalidate for local application scripts and styles
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone()
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache))
            }
            return networkResponse
          })
          .catch(() => cachedResponse)

        return cachedResponse || fetchPromise
      })
    )
    return
  }

  // Default network fetch
  event.respondWith(fetch(event.request))
})
