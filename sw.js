/**
 * Service Worker for Navigation Page Caching
 * 为不同类型的资源设置不同的缓存策略
 */

const CACHE_NAME = 'nav-cache-v1';
const STATIC_CACHE_NAME = 'nav-static-v1';

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/main.js',
  '/style.css'
];

// 检查是否为静态资源
function isStaticAsset(url) {
  const staticPaths = ['/', '/index.html', '/app.js', '/main.js', '/style.css', '/sw.js'];
  return staticPaths.some(path => url.endsWith(path));
}

// 检查是否为API请求
function isApiRequest(url) {
  return url.includes('/api/');
}

// Cache First 策略：优先从缓存获取，缓存不存在时从网络获取
async function cacheFirstStrategy(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('Cache First - Serving from cache:', request.url);
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // 缓存成功的响应
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      console.log('Cache First - Added to cache:', request.url);
    }
    return networkResponse;
  } catch (error) {
    console.log('Cache First - Fetch failed:', error);
    throw error;
  }
}

// Network First 策略：优先从网络获取，网络失败时从缓存获取
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // 缓存成功的响应
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      console.log('Network First - Serving from network and cached:', request.url);
    }
    return networkResponse;
  } catch (error) {
    console.log('Network First - Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('Network First - Serving from cache:', request.url);
      return cachedResponse;
    }
    throw error;
  }
}

// 安装 Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker installed and static assets cached');
        // 强制激活新的 Service Worker
        return self.skipWaiting();
      })
  );
});

// 激活 Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // 删除旧版本的缓存
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('Service Worker activated');
      // 立即控制所有客户端
      return self.clients.claim();
    })
  );
});

// 处理请求
self.addEventListener('fetch', event => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') {
    return;
  }

  // 跳过非 HTTP 请求（如 chrome-extension://）
  if (!event.request.url.startsWith('http')) {
    return;
  }

  const url = new URL(event.request.url);

  // 根据请求类型选择不同的缓存策略
  if (isApiRequest(url.pathname)) {
    // API请求使用Network First策略
    event.respondWith(networkFirstStrategy(event.request));
  } else if (isStaticAsset(url.pathname)) {
    // 静态资源使用Cache First策略
    event.respondWith(cacheFirstStrategy(event.request));
  } else {
    // 其他请求使用默认策略（可以根据需要调整）
    event.respondWith(cacheFirstStrategy(event.request));
  }
});

// 处理消息
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
