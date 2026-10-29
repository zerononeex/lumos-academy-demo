// Offline-tolerant SHELL only. Caches static, non-personal assets; never API responses or any page
// (pages carry a per-request CSP nonce, and /play and /teacher carry a child's or a class's data).
// Game play needs a connection in v1.
// Precache only what this worker actually serves from cache: the offline page (navigation fallback) and
// the icon (cache-first below). "/" and the manifest used to be precached but were never served from cache.
const CACHE = "lumos-shell-v2";
const PRECACHE = ["/offline.html", "/icons/icon.svg"];

self.addEventListener("install", (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE))));
self.addEventListener("activate", (e) =>
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))));

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/games/") || url.pathname.startsWith("/icons/")) {
    // Immutable, non-personal assets: cache-first.
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return res;
    })));
  } else if (e.request.mode === "navigate") {
    // Pages: always network (no-store); offline fallback page only.
    e.respondWith(fetch(e.request).catch(() => caches.match("/offline.html")));
  }
});
