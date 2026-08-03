const VERSION = "v1";
const SHELL_CACHE = `gymgraph-shell-${VERSION}`;
const RUNTIME_CACHE = `gymgraph-runtime-${VERSION}`;
const API_CACHE = `gymgraph-api-${VERSION}`;

const SHELL_URLS = [
  "/",
  "/progress",
  "/analytics",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  const keep = new Set([SHELL_CACHE, RUNTIME_CACHE, API_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !keep.has(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function isNextStaticAsset(url) {
  return url.pathname.startsWith("/_next/static/");
}

function isApiRequest(url) {
  return url.pathname.startsWith("/api/");
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      networkFirst(request, SHELL_CACHE).catch(() =>
        caches.match("/").then((res) => res ?? Response.error())
      )
    );
    return;
  }

  if (isApiRequest(url)) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  if (isNextStaticAsset(url) || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
    return;
  }
});
