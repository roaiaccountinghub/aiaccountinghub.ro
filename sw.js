/* ============================================================
   AI ACCOUNTING HUB — Service Worker
   ------------------------------------------------------------
   Ce face:
     1. Face site-ul instalabil ca aplicație (împreună cu manifest.json).
     2. Ține un cache minim, ca aplicația să pornească și fără rețea.
     3. Verifică periodic /updates.json și pune bulina pe iconiță +
        o notificare locală când apare conținut nou.

   Ce NU face — deloc, niciodată:
     · nu trimite nimic către niciun server al nostru;
     · nu folosește Web Push, deci nu există abonare și nu se
       stochează niciun identificator de dispozitiv;
     · tot ce reține (ce ai citit, ce te interesează) rămâne în
       browserul tău, în Cache Storage / localStorage.

   ZONĂ INTANGIBILĂ: paginile de joc arcade-*.html și manifestele
   lor sunt ocolite complet de service worker — nu sunt cache-uite,
   nu sunt interceptate, se comportă exact ca înainte.
   ============================================================ */

const VERSION       = 'v1';
const SHELL_CACHE   = 'aiah-shell-' + VERSION;
const RUNTIME_CACHE = 'aiah-runtime-' + VERSION;
const STATE_CACHE   = 'aiah-state';           /* nu se versionează: e memoria utilizatorului */
const STATE_URL     = '/__aiah-state.json';   /* URL sintetic, nu există pe server */

const UPDATES_URL   = '/updates.json';
const APP_URL       = '/noutati.html?sursa=app';
const ICON          = '/assets/icons/app-192.png';

/* Minimul cu care aplicația pornește offline. Deliberat mic:
   nu vrem să pre-descărcăm tot site-ul pe telefonul nimănui. */
const SHELL = [
  '/noutati.html',
  '/assets/styles.css',
  '/assets/site.js',
  '/assets/icons/app-192.png'
];

/* ---------- zona intangibilă ---------- */
function isArcade(url) {
  return /\/arcade-[^/]+\.html$/.test(url.pathname) ||
         /\/manifest-arcade-[^/]+\.json$/.test(url.pathname);
}

/* ---------- instalare / activare ---------- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((c) => c.addAll(SHELL))
      .catch(() => { /* dacă un fișier lipsește, instalarea nu trebuie să cadă */ })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith('aiah-') && k !== SHELL_CACHE && k !== RUNTIME_CACHE && k !== STATE_CACHE)
            .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ---------- strategii de rețea ---------- */
async function networkFirst(request) {
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    const shell = await caches.match('/noutati.html');
    if (shell) return shell;
    return new Response(
      '<!doctype html><meta charset="utf-8"><title>Offline</title>' +
      '<body style="font-family:system-ui;background:#07121a;color:#e8f3f8;padding:40px">' +
      '<h1>Ești offline</h1><p>Pagina nu e disponibilă fără conexiune.</p></body>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 503 }
    );
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request).then((res) => {
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  }).catch(() => null);
  return cached || network || fetch(request);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }

  if (url.origin !== self.location.origin) return;  /* audio CloudFront, fonturi Google etc. */
  if (isArcade(url)) return;                        /* zona intangibilă */
  if (url.pathname === UPDATES_URL) return;         /* mereu proaspăt */
  if (url.pathname === STATE_URL) return;

  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req));
    return;
  }
  /* CSS și JS: tot rețeaua primează. Altfel, după o publicare nouă, cineva ar
     putea primi pagina nouă cu stilurile vechi — cache-ul rămâne doar plasă
     de siguranță pentru offline. */
  if (/\.(css|js)$/i.test(url.pathname)) {
    event.respondWith(networkFirst(req));
    return;
  }
  /* imaginile și fonturile nu se schimbă la fiecare publicare */
  if (/\.(png|jpe?g|webp|svg|ico|woff2?)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(req));
  }
});

/* ---------- starea locală (Cache Storage, nu pleacă nicăieri) ---------- */
async function readState() {
  try {
    const cache = await caches.open(STATE_CACHE);
    const res = await cache.match(STATE_URL);
    if (!res) return { seen: [], interests: [], notified: [] };
    const s = await res.json();
    return {
      seen: Array.isArray(s.seen) ? s.seen : [],
      interests: Array.isArray(s.interests) ? s.interests : [],
      notified: Array.isArray(s.notified) ? s.notified : []
    };
  } catch (e) {
    return { seen: [], interests: [], notified: [] };
  }
}

async function writeState(next) {
  const cache = await caches.open(STATE_CACHE);
  await cache.put(STATE_URL, new Response(JSON.stringify(next), {
    headers: { 'Content-Type': 'application/json' }
  }));
}

/* ---------- verificarea de conținut nou ---------- */
const TYPE_LABEL = {
  articol:  'Articol nou',
  podcast:  'Podcast nou',
  buzzword: 'Buzzword nou'
};

/* Adresa din updates.json e relativă („podcast.html?play=…”). O transformăm
   în adresă completă, ca deschiderea din notificare să funcționeze la fel
   indiferent de unde e apelată. */
function absolute(url) {
  try { return new URL(url, self.registration.scope).href; }
  catch (e) { return self.registration.scope; }
}

function setBadge(n) {
  try {
    if (n > 0 && self.navigator && self.navigator.setAppBadge) self.navigator.setAppBadge(n);
    else if (self.navigator && self.navigator.clearAppBadge) self.navigator.clearAppBadge();
  } catch (e) { /* platformă fără Badging API — mergem mai departe */ }
}

async function checkUpdates() {
  let data;
  try {
    const res = await fetch(UPDATES_URL, { cache: 'no-store' });
    if (!res.ok) return;
    data = await res.json();
  } catch (e) { return; }

  const items = Array.isArray(data.items) ? data.items : [];
  const state = await readState();

  /* dacă nu a ales încă interese, îl considerăm interesat de tot */
  const wants = (it) => !state.interests.length || state.interests.indexOf(it.type) > -1;

  const unseen = items.filter((it) => wants(it) && state.seen.indexOf(it.id) === -1);
  setBadge(unseen.length);

  const fresh = unseen.filter((it) => state.notified.indexOf(it.id) === -1);
  if (!fresh.length) return;

  /* o singură notificare, chiar dacă s-au adunat mai multe materiale */
  let title, body, target;
  if (fresh.length === 1) {
    const it = fresh[0];
    title  = TYPE_LABEL[it.type] || 'Conținut nou';
    body   = it.title + (it.meta ? ' · ' + it.meta : '');
    target = absolute(it.url);
  } else {
    title  = fresh.length + ' materiale noi';
    body   = fresh.map((it) => it.title).slice(0, 3).join(' · ');
    target = absolute(APP_URL);
  }

  try {
    await self.registration.showNotification(title, {
      body: body,
      icon: ICON,
      badge: ICON,
      tag: 'aiah-updates',
      renotify: true,
      data: { url: target }
    });
  } catch (e) { /* fără permisiune de notificări — bulina rămâne oricum */ }

  await writeState({
    seen: state.seen,
    interests: state.interests,
    notified: state.notified.concat(fresh.map((it) => it.id)).slice(-80)
  });
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'aiah-check-updates') event.waitUntil(checkUpdates());
});

/* rezervă pentru browserele fără Periodic Background Sync:
   pagina poate cere o verificare printr-un sync obișnuit */
self.addEventListener('sync', (event) => {
  if (event.tag === 'aiah-check-updates') event.waitUntil(checkUpdates());
});

/* ---------- dialogul cu paginile ---------- */
self.addEventListener('message', (event) => {
  const msg = event.data || {};
  if (msg.type === 'aiah-state' && msg.state) {
    event.waitUntil(writeState({
      seen: msg.state.seen || [],
      interests: msg.state.interests || [],
      notified: msg.state.notified || []
    }));
  }
  if (msg.type === 'aiah-badge') setBadge(msg.count || 0);
  if (msg.type === 'aiah-check') event.waitUntil(checkUpdates());
});

/* ---------- clic pe notificare ---------- */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || absolute(APP_URL);
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
