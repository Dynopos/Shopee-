const CACHE = 'dynopro-v5';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
];

// Halaman yang TIDAK boleh di-cache — mesti sentiasa segar dari server.
// jual.html mengandungi pautan bayaran; versi lapuk boleh menghantar
// pembeli ke pautan yang salah atau sudah tamat tempoh.
const NEVER_CACHE = ['/jual.html', '/DYNOPRO-Ebook-Untung-Shopee-TikTok.pdf'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Biarkan permintaan silang-domain (cth. gateway bayaran) lalu terus
  // tanpa disentuh service worker.
  if (url.origin !== self.location.origin) return;

  // Halaman jualan & e-book: sentiasa terus ke rangkaian, jangan simpan.
  if (NEVER_CACHE.some(path => url.pathname.endsWith(path))) {
    e.respondWith(fetch(req));
    return;
  }

  // Selebihnya: rangkaian dahulu, cache sebagai sandaran bila offline.
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }))
  );
});
