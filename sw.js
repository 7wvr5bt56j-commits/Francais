// Français Kartei: eigener Cache, räumt nur Caches mit Präfix "francais-" auf
const PREFIX = "francais-";
const CACHE = PREFIX + "v1";
const CORE = ["./", "./index.html", "./manifest.json", "./icon.png"];
const SCOPE = new URL("./", self.registration.scope).pathname; // z. B. /Francais/
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const own = url.origin === location.origin;
  // Seiten anderer Apps auf derselben Adresse nicht anfassen
  if (own && !url.pathname.startsWith(SCOPE)) return;
  // App-Seite: erst Netz (für Updates), ohne Netz aus dem Speicher
  if (req.mode === "navigate" || (own && url.pathname.endsWith(".html"))) {
    e.respondWith(fetch(req).then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put("./index.html", copy)); } return r; })
      .catch(() => caches.open(CACHE).then(c => c.match("./index.html"))));
    return;
  }
  // Alles andere (Icon, Schriften): erst Speicher, sonst Netz und merken
  e.respondWith(caches.open(CACHE).then(c => c.match(req).then(hit => hit || fetch(req).then(r => {
    if (r && (r.ok || r.type === "opaque")) { const copy = r.clone(); c.put(req, copy); }
    return r;
  }))));
});
