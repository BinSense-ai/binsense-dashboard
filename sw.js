// BinSense customer PWA — service worker v3
// Network-first for the app shell so installed phones pick up new dashboard versions.
// Apps Script requests are never cached.

var CACHE_NAME = "binsense-shell-v3";
var SHELL_FILES = ["./index.html", "./manifest.json"];

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
        names.filter(function(name) { return name !== CACHE_NAME; })
             .map(function(name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(event) {
  var request = event.request;
  var url = request.url;

  if (url.indexOf("script.google.com") !== -1) {
    return;
  }

  if (request.method !== "GET") {
    return;
  }

  var requestUrl = new URL(url);
  var isSameOrigin = requestUrl.origin === self.location.origin;
  var isNavigation = request.mode === "navigate";
  var isShellFile =
    requestUrl.pathname.endsWith("/index.html") ||
    requestUrl.pathname.endsWith("/manifest.json");

  if (isSameOrigin && (isNavigation || isShellFile)) {
    event.respondWith(
      fetch(request)
        .then(function(response) {
          if (response && response.ok) {
            var copy = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(request, copy);
            });
          }
          return response;
        })
        .catch(function() {
          return caches.match(request).then(function(cached) {
            return cached || caches.match("./index.html");
          });
        })
    );
    return;
  }

  if (isSameOrigin) {
    event.respondWith(
      caches.match(request).then(function(cached) {
        return cached || fetch(request);
      })
    );
  }
});
