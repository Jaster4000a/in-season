// Offline support. Saved files answer at once, so a weak signal can't leave someone waiting in
// the aisle. Page and data live in one versioned cache and only ever change together: a deploy
// changes VERSION, the browser installs a complete new cache, and the next load uses it.
// VERSION is a content hash written by tools/stamp-sw.cjs. Never edit it by hand.
const VERSION = "in-season-d3dab855734d";
const CORE = ["./", "index.html", "data/regions.json", "data/items.json", "data/choose.json", "data/places.json", "data/icons.svg", "manifest.webmanifest", "icons/icon.svg"];
// Needed for the map and for GPS. Worth having offline, but not worth failing the install over.
const EXTRA = ["data/counties-10m.json", "vendor/d3.min.js", "vendor/topojson-client.min.js", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];
const scope = new URL("./", self.location).href;
const known = new Set([...CORE, ...EXTRA].map(p => new URL(p, scope).href));
const indexUrl = new URL("index.html", scope).href;

const fresh = p => new Request(new URL(p, scope), { cache: "reload" });

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(async c => {
    await c.addAll(CORE.map(fresh)); // All or nothing: a partial page and data set never goes live.
    await c.addAll(EXTRA.map(fresh)).catch(() => {});
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
    if (saved) return saved;
    const r = await fetch(req); // Only EXTRA files can be missing, if their install step failed.
    if (r.ok) cache.put(key, r.clone());
    return r;
  })());
});
