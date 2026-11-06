// Offline support. The saved copy answers at once and refreshes in the background, so a weak
// signal can't leave someone waiting in the aisle. Bump VERSION to drop old caches.
const VERSION = "in-season-v3";
const CORE = ["./", "index.html", "data/regions.json", "data/items.json", "data/choose.json", "data/places.json", "data/icons.svg", "manifest.webmanifest", "icons/icon.svg"];
// Needed for the map and for GPS. Worth having offline, but not worth failing the install over.
const EXTRA = ["data/counties-10m.json", "vendor/d3.min.js", "vendor/topojson-client.min.js", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];
const scope = new URL("./", self.location).href;
const known = new Set([...CORE, ...EXTRA].map(p => new URL(p, scope).href));
const indexUrl = new URL("index.html", scope).href;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(async c => {
    await c.addAll(CORE);
    await c.addAll(EXTRA).catch(() => {});
    await self.skipWaiting();
  }));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("in-season-") && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  url.search = ""; url.hash = "";
  const isPage = url.href === scope || url.href === indexUrl;
  if (!isPage && !known.has(url.href)) return; // Everything else, including reports, goes straight out.
  const key = isPage ? indexUrl : url.href;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const saved = await cache.match(key);
    const fresh = fetch(req).then(r => { if (r.ok) cache.put(key, r.clone()); return r; });
    if (saved) { e.waitUntil(fresh.catch(() => {})); return saved; }
    return fresh;
  })());
});
