// ==== نسخة الكاش ====
// كل ما تحدّثين محتوى الموقع (index.html أو أي ملف)، لازم تزيدي هالرقم بواحد.
// هيك المستخدمين رح ياخدوا النسخة الجديدة أوتوماتيكياً بدل ما يضلوا شايفين نسخة قديمة محفوظة بالكاش.
const CACHE_VERSION = 'v2';
const CACHE_NAME = 'tariff-app-' + CACHE_VERSION;

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// عند التثبيت: نخزّن الملفات الأساسية بالكاش
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL);
    }).then(function () {
      return self.skipWaiting(); // يخلي النسخة الجديدة تصير فعالة فوراً
    })
  );
});

// عند التفعيل: نحذف أي كاش قديم من نسخة سابقة
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) { return key.indexOf('tariff-app-') === 0 && key !== CACHE_NAME; })
            .map(function (key) { return caches.delete(key); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// استراتيجية "الشبكة أولاً" لملف index.html حتى تنوصل التحديثات بسرعة،
// ولو ما في إنترنت منستخدم النسخة المخزنة بالكاش (يعني التطبيق يشتغل حتى بدون نت)
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).then(function (response) {
      var copy = response.clone();
      caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, copy); });
      return response;
    }).catch(function () {
      return caches.match(event.request).then(function (cached) {
        return cached || caches.match('./index.html');
      });
    })
  );
});

// نسمح للصفحة تطلب من الـ service worker يتفعّل فوراً (تُستخدم مع إشعار "تحديث متوفر")
self.addEventListener('message', function (event) {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
