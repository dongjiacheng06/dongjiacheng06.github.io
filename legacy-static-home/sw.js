/**
 * Service Worker for Performance Optimization
 * 提供离线缓存和性能优化功能
 */

const CACHE_NAME = 'jiacheng-dong-v1.0.0';
const STATIC_CACHE = 'static-cache-v1';
const DYNAMIC_CACHE = 'dynamic-cache-v1';

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/blog.html',
  '/hobbies.html',
  '/assets/css/main.css',
  '/assets/js/main.js',
  '/assets/images/personal_photo.jpg',
  '/manifest.json'
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Error during service worker installation:', error);
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// 获取事件 - 缓存策略
self.addEventListener('fetch', event => {
  // 仅处理GET请求
  if (event.request.method !== 'GET') {
    return;
  }

  // 跳过非HTTP(S)请求
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果在缓存中找到，返回缓存版本
        if (response) {
          return response;
        }

        // 否则从网络获取
        return fetch(event.request)
          .then(fetchResponse => {
            // 检查是否是有效响应
            if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
              return fetchResponse;
            }

            // 克隆响应
            const responseToCache = fetchResponse.clone();

            // 决定缓存策略
            const url = new URL(event.request.url);
            
            // 静态资源使用静态缓存
            if (url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2)$/)) {
              caches.open(STATIC_CACHE)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            // HTML页面使用动态缓存
            else if (url.pathname.match(/\.(html)$/) || url.pathname === '/') {
              caches.open(DYNAMIC_CACHE)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }

            return fetchResponse;
          })
          .catch(error => {
            console.error('Fetch failed:', error);
            
            // 如果是页面请求失败，返回离线页面
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
            
            // 对于其他资源，抛出错误
            throw error;
          });
      })
  );
});

// 消息事件 - 处理来自主线程的消息
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 推送事件（如果需要推送通知）
self.addEventListener('push', event => {
  console.log('Push received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/assets/images/icon-192.png',
    badge: '/assets/images/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Go to the site',
        icon: '/assets/images/icon-192.png'
      },
      {
        action: 'close',
        title: 'Close notification',
        icon: '/assets/images/icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Jiacheng Dong Website', options)
  );
});

// 通知点击事件
self.addEventListener('notificationclick', event => {
  console.log('Notification click received:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
