// BinSense Field Monitor — minimal service worker
// Purpose: make the app installable (PWA requirement) and cache the
// app shell so it opens instantly even on a poor connection.
// Live readings always come from the network — never cached.

var CACHE_NAME = "binsense-shell-v2";

var SHELL_FILES = [
  "./index.html",
  "./manifest.json"
];

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(SHELL_FILES);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names
          .filter(function(name) {
            return name !== CACHE_NAME;
          })
          .map(function(name) {
            return caches.delete(name);
          })
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", function(event) {
  var url = event.request.url;

  // Never cache Apps Script calls.
  // Sensor readings and Gemini results must always be live.
  if (url.indexOf("script.google.com") !== -1) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(cachedResponse) {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request);
    })
  );
});
