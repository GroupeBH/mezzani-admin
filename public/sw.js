const STATIC_CACHE = "mezani-static-v1";
const NAVIGATION_CACHE = "mezani-navigation-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => ![STATIC_CACHE, NAVIGATION_CACHE].includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname === "/mezani-mark.svg") {
    event.respondWith(caches.open(STATIC_CACHE).then(async (cache) => (await cache.match(request)) || fetch(request).then((response) => { cache.put(request, response.clone()); return response; })));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => { const copy = response.clone(); void caches.open(NAVIGATION_CACHE).then((cache) => cache.put(request, copy)); return response; })
        .catch(async () => (await caches.open(NAVIGATION_CACHE)).match(request) || (await caches.open(NAVIGATION_CACHE)).match("/dashboard") || Response.error()),
    );
  }
});
