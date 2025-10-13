// sw.js
// version 2
const CACHE_NAME = 'gemini-pwa-cache-v0.54'; // 更新後はここも変更
const urlsToCache = [
  './', // ルートパス (index.html を指すことが多い)
  './index.html',
  './manifest.json',
  './marked.js',
  // アイコンファイルもキャッシュする場合 (manifest.json で指定したもの)
  './icon-192x192.png',
];

// インストール時にキャッシュを作成
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Opened cache');
        return cache.addAll(urlsToCache).catch(error => {
          console.error('SW: Failed to cache initial resources during install:', error);
        });
      })
      .then(() => {
        // インストール完了後、すぐにアクティブにする (古いSWを待たない)
        return self.skipWaiting();
      })
  );
});

// フェッチイベントの処理
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // APIリクエスト (Google APIへのPOST) はService Workerの処理から完全に除外する
  if (requestUrl.hostname === 'generativelanguage.googleapis.com' && event.request.method === 'POST') {
    return; 
  }

  // それ以外のリクエスト (主にGET) はキャッシュ優先戦略 (Cache falling back to network)
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          (networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
               const isCachable = urlsToCache.some(url => {
                   if (url === './') return requestUrl.pathname === '/' || requestUrl.pathname === '/index.html';
                   return requestUrl.pathname.endsWith(url.substring(1));
               });
               if (isCachable) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME)
                      .then(cache => {
                        cache.put(event.request, responseToCache);
                      });
               }
            }
            return networkResponse;
          }
        ).catch(error => {
          console.error('SW: Fetch failed for:', event.request.url, error);
          if (event.request.headers.get('accept').includes('application/json')) {
            return new Response(JSON.stringify({ error: 'Offline or network error' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          return new Response('Network error occurred.', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// activateイベントで古いキャッシュを削除 & クライアント制御の要求
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('SW: Activating new version and claiming clients...');
      // 新しいService Workerがアクティブになったら、すぐにクライアントを制御する
      // この後、クライアント側で 'controllerchange' イベントが発火する
      return self.clients.claim();
    })
  );
});

// メッセージリスナー (キャッシュクリア用)
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'clearCache') {
    console.log('SW: Clearing cache...');
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('SW: Cache cleared.');
      // Service Workerの登録解除(unregister)やリロード命令を削除します。
      // キャッシュクリアが完了したことをクライアントに通知するだけに留めます。
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
          clients.forEach(client => {
              client.postMessage({ status: 'cacheCleared' });
          });
      });
    }).catch(error => {
      console.error('SW: Failed to clear cache:', error);
       self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
          clients.forEach(client => {
              client.postMessage({ status: 'cacheClearFailed', error: error.message });
          });
      });
    });
  }
});