const CACHE_NAME = 'maha-ftouni-cache-v1'
const urlsToCache = [
  '/',
  '/manifest.json',
  '/offline.html',
]

// تثبيت Service Worker وتخزين الملفات الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  )
})

// تفعيل Service Worker وحذف الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    }).then(() => self.clients.claim())
  )
})

// اعتراض الطلبات وتقديم استجابة من الكاش إن أمكن
self.addEventListener('fetch', (event) => {
  // تجاهل الطلبات غير GET أو من نطاقات خارجية
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        return fetch(event.request)
          .then((response) => {
            // تخزين الاستجابات الناجحة فقط
            if (response.status === 200) {
              const responseClone = response.clone()
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone))
            }
            return response
          })
          .catch(() => {
            // عند فشل الاتصال، عرض صفحة offline
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html')
            }
            return new Response('', { status: 404 })
          })
      })
  )
})