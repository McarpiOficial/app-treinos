// Service Worker: cacheia todo o app no primeiro acesso para funcionar 100%
// offline depois (dados continuam só no localStorage, isso aqui é só o "casco"
// do app: HTML/CSS/JS/imagens). Caminhos relativos para funcionar também
// dentro de uma subpasta no GitHub Pages (ex.: /app-treinos/).
const CACHE = 'treinos-cache-v1';

const ARQUIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/exercicios.js',
  './js/dados.js',
  './js/aerobico.js',
  './js/app.js',
  './img/icone-192.png',
  './img/icone-512.png',
  './img/ex/_generico.svg',
  './img/ex/supino.svg',
  './img/ex/supino-inclinado.svg',
  './img/ex/fly.svg',
  './img/ex/triceps-corda.svg',
  './img/ex/triceps-frances.svg',
  './img/ex/triceps-testa.svg',
  './img/ex/remada-curvada.svg',
  './img/ex/remada-aberta.svg',
  './img/ex/puxada-aberta.svg',
  './img/ex/rosca-scott.svg',
  './img/ex/rosca-martelo.svg',
  './img/ex/rosca-direta.svg',
  './img/ex/agachamento-hack.svg',
  './img/ex/cadeira-extensora.svg',
  './img/ex/adutora.svg',
  './img/ex/mesa-flexora.svg',
  './img/ex/cadeira-flexora.svg',
  './img/ex/leg-press.svg',
  './img/ex/crucifixo-inverso.svg',
  './img/ex/elevacao-frontal.svg',
  './img/ex/elevacao-lateral.svg',
  './img/ex/desenvolvimento.svg'
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
