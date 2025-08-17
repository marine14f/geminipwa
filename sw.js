// sw.js
// ===============================
// Cache versioning
// ===============================
const CACHE_VERSION = '0.32'; // ← アセットを更新したら上げる
const STATIC_CACHE = `static-${CACHE_VERSION}`;

// 事前キャッシュする静的アセット（index.htmlはfetchでnetwork-first適用されるが、ここでのprecacheはOK）
const PRECACHE_URLS = [
  './',
  './index.html',
  './style.css?v=0.33',
  './app.js?v=0.33',
  './function-calling.js?v=0.33',
  './favicon.ico',
];

// ===============================
// Install
// ===============================
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await cache.addAll(PRECACHE_URLS);
    await self.skipWaiting(); // 新SWへ即切り替え
  })());
});

// ===============================
// Activate
// ===============================
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map((k) => {
        if (k !== STATIC_CACHE) return caches.delete(k);
      })
    );
    await self.clients.claim(); // 既存タブも新SWの管理下に
  })());
});

// ===============================
// Fetch
// ===============================
// document(=index.html などのナビゲーション)は network-first
// それ以外（JS/CSS/画像等）は cache-first
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // nav/document は常に最新を取りに行く（世代ズレ防止）
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        return fresh;
      } catch (_) {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match('./index.html');
        return cached || new Response('Offline', { status: 503 });
      }
    })());
    return;
  }

  // その他は cache-first
  event.respondWith((async () => {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(req);
    if (cached) return cached;

    const res = await fetch(req);
    // putに失敗するケース(opaqueなど)は握りつぶす
    try { await cache.put(req, res.clone()); } catch (_) {}
    return res;
  })());
});

// ===============================
// Messages
// ===============================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
