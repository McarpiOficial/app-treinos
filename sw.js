// Service Worker: cacheia todo o app no primeiro acesso para funcionar 100%
// offline depois (dados continuam só no localStorage, isso aqui é só o "casco"
// do app: HTML/CSS/JS/imagens). Caminhos relativos para funcionar também
// dentro de uma subpasta no GitHub Pages (ex.: /app-treinos/).
const CACHE = 'treinos-cache-v21';

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
  './js/abdominal.js',
  './js/alimentos.js',
  './js/reconhecimentoFoto.js',
  './js/alimentacao.js',
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

  const url = new URL(event.request.url);
  const ehCodigo = event.request.mode === 'navigate'
    || /\.(?:html|js|css|webmanifest)$/.test(url.pathname);

  if (ehCodigo) {
    // Código: rede primeiro, para que uma versão nova do app apareça já na
    // primeira abertura. Sem internet, cai para o cache e continua funcionando.
    //
    // cache:'no-cache' é essencial aqui — sem isso, o fetch() dentro do
    // service worker ainda pode ser respondido pelo cache HTTP comum do
    // navegador (uma camada ANTES do service worker), servindo uma versão
    // antiga mesmo com "rede primeiro". Isso obriga a sempre revalidar com o
    // servidor (um 304 é rápido quando nada mudou; um 200 novo quando mudou).
    event.respondWith(
      fetch(new Request(event.request, { cache: 'no-cache' })).then(function (respostaRede) {
        const copia = respostaRede.clone();
        caches.open(CACHE).then(function (cache) { cache.put(event.request, copia); });
        return respostaRede;
      }).catch(function () {
        return caches.match(event.request).then(function (cacheado) {
          if (cacheado) return cacheado;
          if (event.request.mode === 'navigate') return caches.match('./index.html');
        });
      })
    );
    return;
  }

  // Fotos e ícones: cache primeiro (não mudam e são o grosso do peso).
  // As fotos dos exercícios não vão no precache — entram no cache conforme
  // você abre os treinos, o que mantém a instalação leve.
  event.respondWith(
    caches.match(event.request).then(function (respostaCache) {
      if (respostaCache) return respostaCache;
      return fetch(event.request).then(function (respostaRede) {
        const copia = respostaRede.clone();
        caches.open(CACHE).then(function (cache) { cache.put(event.request, copia); });
        return respostaRede;
      });
    })
  );
});
