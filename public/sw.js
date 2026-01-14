const CACHE_NAME = "spg-report-v1"
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
]

// Install: simpan asset dasar
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate: hapus cache lama
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    )
  )
  self.clients.claim()
})

// Fetch: cache-first, fallback ke network
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached

      return fetch(event.request)
        .then((response) => {
          // simpan response baru ke cache
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone())
            return response
          })
        })
        .catch(() => {
          // kalau offline & tidak ada cache
          if (event.request.mode === "navigate") {
            return caches.match("/")
          }
        })
    })
  )
})
