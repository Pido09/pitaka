// Pitaka service worker: makes the app open instantly and work offline.
// When you upload a new index.html, change VERSION (pitaka-v8, pitaka-v8, ...)
// and the app will show "Update available" with a Refresh button.
const VERSION = "pitaka-v8";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  // cache: "reload" skips the browser cache so the new files are really fetched
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL.map(u => new Request(u, {cache: "reload"})))));
});
self.addEventListener("message", e => { if (e.data === "SKIP_WAITING") self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Never cache your Google Sheet sync or price calls.
  if (url.hostname.endsWith("google.com") || url.hostname.endsWith("googleusercontent.com")) return;
  // Fonts: cache first.
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open(VERSION).then(async c => (await c.match(req)) || fetch(req).then(r => { c.put(req, r.clone()); return r; })));
    return;
  }
  // App files: serve this version's cached copy instantly; fall back to the network.
  if (url.origin === location.origin) {
    e.respondWith(caches.open(VERSION).then(async c => (await c.match(req, {ignoreSearch: true})) || fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; })));
  }
});
