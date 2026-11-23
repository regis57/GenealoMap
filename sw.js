// GenealoMap - offline copy (service worker). Optional: without this file the page works online only.
// It keeps in the browser's cache the page and the data files of this folder, so the page opens and plays without a connection.
// It never stores a family file: the visitor's file stays where the page keeps it (local storage), and a tree published
// with ?file=... is not cached. Only requests to this folder are handled; everything else goes to the network untouched.
const CACHE = 'genealomap-1';
// Same list as HIST in index.html (tools/check.mjs compares them).
const HIST = [1500, 1530, 1600, 1650, 1700, 1715, 1783, 1800, 1815, 1880, 1900, 1914, 1920, 1930, 1938, 1945, 1960, 1994, 2000, 2010];
const CORE = ['./', 'index.html', 'world.json', 'gaz.json', 'app/manifest.webmanifest', 'app/icon.svg', 'app/icon-192.png', 'app/icon-512.png', 'hist/names.json', 'gaz/index.json'];
const scope = new URL(self.registration.scope);
// Files that may be kept: the page, its data and the app icons. Anything else (a published tree, other files of the site) is not cached.
const keep = path => /^(|index\.html|world\.json|gaz\.json|app\/[\w.-]+|hist\/[\w.-]+\.json|gaz\/[\w.-]+\.json)$/.test(path);

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // one by one: the optional folders may be missing on some hosts
    for (const f of [...CORE, ...HIST.map(y => 'hist/' + y + '.json')]) { try { await c.add(f); } catch (err) {} }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('genealomap-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  const path = url.pathname.slice(scope.pathname.length);
  if (req.mode === 'navigate' || path === '' || path === 'index.html') {
    // the page: the network first (to get updates), the saved copy when offline
    e.respondWith((async () => {
      try {
        const r = await fetch(req);
        if (r.ok) { const c = await caches.open(CACHE); await c.put('index.html', r.clone()); }
        return r;
      } catch (err) {
        return (await caches.match('index.html')) || (await caches.match('./')) || Response.error();
      }
    })());
    return;
  }
  if (!keep(path) || url.search) return;
  // data files: the saved copy at once, refreshed in the background
  e.respondWith((async () => {
    const c = await caches.open(CACHE), hit = await c.match(req);
    const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; });
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    return net;
  })());
});
