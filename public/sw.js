const CACHE_NAME = "farmstellar-v1";
const API_CACHE = "farmstellar-api-v1";
const CORE_ASSETS = [
  "/",
  "/login",
  "/dashboard",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];
const API_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      try {
        return cache.addAll(CORE_ASSETS);
      } catch (e) {
        // fallback: individually add
        return Promise.all(
          CORE_ASSETS.map((u) => cache.add(u).catch(() => {}))
        );
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME && k !== API_CACHE) return caches.delete(k);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isApiRequest = url.pathname.startsWith("/api/");
  const isNavigation = event.request.mode === "navigate";

  // For navigation requests, try network first, fallback to cache
  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res && res.status === 200) {
            const r = res.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, r);
            });
          }
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // For API requests, use network-first with short TTL
  if (isApiRequest) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            const cacheWithTTL = {
              response: copy,
              timestamp: Date.now(),
            };
            caches.open(API_CACHE).then((cache) => {
              cache.put(
                event.request,
                new Response(JSON.stringify(cacheWithTTL), {
                  headers: { "Content-Type": "application/json" },
                })
              );
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            if (cached) {
              try {
                const data = JSON.parse(cached.body);
                // Check if cached response is still fresh (within TTL)
                if (Date.now() - data.timestamp < API_CACHE_TTL) {
                  return data.response;
                }
              } catch (e) {}
            }
            return cached || new Response(null, { status: 404 });
          });
        })
    );
    return;
  }

  // For static assets (images, CSS, JS), cache-first strategy
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, copy).catch(() => {});
            });
          }
          return response;
        })
        .catch(() => null);
    })
  );
});

// Handle cache clearing message from client
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CLEAR_CACHE") {
    Promise.all([caches.delete(API_CACHE), caches.delete(CACHE_NAME)]).then(
      () => {
        event.ports[0].postMessage({ success: true });
      }
    );
  }
});
