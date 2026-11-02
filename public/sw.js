// Service worker di reAIding companion: permette l'uso offline di lettore e libreria.
// Non tocca mai le chiamate al Worker, ai modelli o a siti esterni.
const CACHE = "rc-v13";
const SCOPE = self.registration.scope; // finisce con "/"
const SHELL = ["", "libreria/", "lettore/", "chat/", "memoria/", "backup/", "impostazioni/", "privacy/", "condizioni/", "aiuto/", "domande/", "aggiungi-file/", "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png"]
  .map((p) => new URL(p, SCOPE).href);

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k.startsWith("rc-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (!url.href.startsWith(SCOPE)) return; // solo il nostro sito

  // Pagine: prima la rete (così vedi sempre la versione nuova), se manca la rete usa la copia salvata
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return r; })
        .catch(async () =>
          (await caches.match(req, { ignoreSearch: true })) ||
          (await caches.match(new URL("./", SCOPE).href)) ||
          Response.error())
    );
    return;
  }

  // File con nome "a impronta" (non cambiano mai): prima la copia salvata
  if (url.pathname.includes("/_next/static/")) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((r) => {
        if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return r;
      }))
    );
    return;
  }

  // Tutto il resto: mostra subito la copia salvata e intanto la aggiorna
  e.respondWith(
    caches.open(CACHE).then(async (c) => {
      const hit = await c.match(req);
      const net = fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || (await net) || Response.error();
    })
  );
});
