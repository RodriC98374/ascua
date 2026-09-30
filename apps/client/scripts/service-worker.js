// Service worker de la web instalada (fase 19, D26). `build-pwa.mjs` le antepone `PWA` con la
// versión y la lista de páginas y archivos de esta exportación.
//
// - Al instalarse guarda todo: las páginas y los archivos de la app (JS, CSS, fuentes, sonidos).
// - Páginas: primero la red (siempre la versión publicada) y, sin conexión, la guardada.
// - Archivos: primero lo guardado; llevan hash en el nombre, así que nunca quedan viejos.
// - Firebase y todo lo de otros dominios pasa de largo: los datos sin conexión ya los guarda la
//   caché persistente de Firestore.
/* global PWA */

const CACHE = `ascua-${PWA.version}`;

/** '/metas/' y '/metas' son la misma página. */
function pageKey(pathname) {
  return pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
}

/**
 * Hosting puede responder con una redirección (p. ej. agrega la barra final); una respuesta
 * redirigida no sirve para contestar una navegación, así que se guarda una copia limpia.
 */
async function storable(response) {
  if (!response.redirected) return response;
  return new Response(await response.blob(), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

async function precache() {
  const cache = await caches.open(CACHE);
  const pages = [...PWA.pages, ...PWA.dynamicPages.map(({ page }) => page)];
  await Promise.all([
    ...pages.map(async (page) => {
      const response = await fetch(page, { cache: 'reload' });
      if (!response.ok) throw new Error(`No se pudo guardar ${page}`);
      await cache.put(page, await storable(response));
    }),
    ...PWA.assets.map(async (asset) => {
      const response = await fetch(asset, { cache: 'reload' });
      if (!response.ok) throw new Error(`No se pudo guardar ${asset}`);
      await cache.put(asset, await storable(response));
    }),
  ]);
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('ascua-') && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** La página guardada para una ruta, incluidas las dinámicas (/metas/abc → /metas/[goalId]). */
async function cachedPage(pathname) {
  const cache = await caches.open(CACHE);
  const key = pageKey(pathname);
  const dynamic = PWA.dynamicPages.find(({ pattern }) => new RegExp(pattern).test(key));
  return (
    (await cache.match(key)) ??
    (dynamic && (await cache.match(dynamic.page))) ??
    (await cache.match('/'))
  );
}

async function networkFirst(request, url) {
  try {
    return await fetch(request);
  } catch (error) {
    const cached = await cachedPage(url.pathname);
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  return fetch(request);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, url));
    return;
  }
  event.respondWith(cacheFirst(request));
});
