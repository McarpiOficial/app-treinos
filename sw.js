// Service Worker: cacheia todo o app no primeiro acesso para funcionar 100%
// offline depois (dados continuam só no localStorage, isso aqui é só o "casco"
// do app: HTML/CSS/JS/imagens). Caminhos relativos para funcionar também
// dentro de uma subpasta no GitHub Pages (ex.: /app-treinos/).
const CACHE = 'treinos-cache-v2';

const ARQUIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/exercicios.js',
  './js/biblioteca.js',
  './js/imagens.js',
  './js/dados.js',
  './js/aerobico.js',
  './js/app.js',
  './img/icone-192.png',
  './img/icone-512.png',
  './img/ex/_generico.svg'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) { return cache.addAll(ARQUIVOS); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (chaves) {
      return Promise.all(chaves.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(function (respostaCache) {
      if (respostaCache) return respostaCache;
      return fetch(event.request).then(function (respostaRede) {
        const copia = respostaRede.clone();
        caches.open(CACHE).then(function (cache) { cache.put(event.request, copia); });
        return respostaRede;
      }).catch(function () {
        if (event.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
