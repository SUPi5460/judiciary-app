// Minimal service worker for PWA installability
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', () => {
  // No caching - just pass through to network
  // This app requires online access (AI-powered)
})
