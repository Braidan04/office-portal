
const CACHE_NAME = "office-portal-shell-v2";

const APP_FILES = [
  "./",
  "./login.html",
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./offline-editor.html",
  "./app-launch.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(APP_FILES)
    )
  );

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  event.respondWith(
    fetch(request).catch(async () => {
      const cached = await caches.match(request);

      if (cached) {
        return cached;
      }

      if (request.mode === "navigate") {
        return (
          await caches.match("./login.html") ||
          new Response("You are offline. This page is not cached.", {
            status: 503,
            headers: { "Content-Type": "text/plain" }
          })
        );
      }

      return new Response(
        "You are offline and this file is not cached.",
        {
          status: 503,
          headers: { "Content-Type": "text/plain" }
        }
      );
    })
  );
});
