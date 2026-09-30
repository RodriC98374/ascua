// Después de `expo export` (fase 19): convierte la web exportada en una app instalable que abre sin
// internet. Escribe en dist el manifiesto (colores de `src/theme/palette.json`) y el service worker
// con la lista de lo que guarda al instalarse, y comprueba que cada ruta dinámica tenga su
// reescritura en firebase.json (sin ella, recargar esa página en Hosting da 404).
// Uso, desde apps/client: node scripts/build-pwa.mjs
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const palette = JSON.parse(readFileSync(join(ROOT, 'src/theme/palette.json'), 'utf8'));
const firebase = JSON.parse(readFileSync(join(ROOT, '../../firebase.json'), 'utf8'));

function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? listFiles(path) : [relative(DIST, path).replaceAll('\\', '/')];
  });
}

const GENERATED = new Set(['sw.js', 'manifest.webmanifest']);
const files = listFiles(DIST).filter((file) => !GENERATED.has(file));

// Páginas: los HTML de cada ruta. Las copias por grupo ("(app)/…"), el mapa del sitio y la página
// de "no encontrada" no se visitan nunca.
const pages = files
  .filter((file) => file.endsWith('.html'))
  .filter((file) => !file.includes('(') && !file.startsWith('_') && !file.startsWith('+'))
  .map((file) => {
    const path = `/${file.replace(/\.html$/, '')}`.replace(/\/index$/, '');
    return path === '' ? '/' : path;
  })
  .sort();

const dynamicPages = pages.filter((page) => page.includes('['));
const staticPages = pages.filter((page) => !page.includes('['));

// Cada ruta dinámica necesita su reescritura: '/metas/*/edit' → '/metas/[goalId]/edit.html'.
const rewrites = firebase.hosting.rewrites ?? [];
const missing = dynamicPages.filter((page) => {
  const source = page.replace(/\[[^\]]+\]/g, '*');
  return !rewrites.some(
    (rewrite) => rewrite.source === source && rewrite.destination === `${page}.html`,
  );
});
if (missing.length > 0) {
  console.error('Faltan reescrituras en firebase.json para estas rutas dinámicas:');
  for (const page of missing)
    console.error(
      `  { "source": "${page.replace(/\[[^\]]+\]/g, '*')}", "destination": "${page}.html" }`,
    );
  process.exit(1);
}

const assets = files.filter((file) => !file.endsWith('.html')).map((file) => `/${file}`);

// La versión cambia con cualquier archivo: así el navegador instala el service worker nuevo.
const hash = createHash('sha256');
for (const file of files.sort()) hash.update(file).update(readFileSync(join(DIST, file)));
const version = hash.digest('hex').slice(0, 12);

const manifest = {
  name: 'Ascua',
  short_name: 'Ascua',
  description: 'Tus hábitos, tu racha y tus recompensas.',
  lang: 'es',
  dir: 'ltr',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  background_color: palette.light['surface-100'],
  theme_color: palette.light['surface-200'],
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    {
      src: '/icons/icon-maskable-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
};
writeFileSync(join(DIST, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));

const config = {
  version,
  pages: staticPages,
  dynamicPages: dynamicPages.map((page) => ({
    pattern: `^${page.replace(/\[[^\]]+\]/g, '[^/]+')}$`,
    page,
  })),
  assets: [...assets, '/manifest.webmanifest'],
};
const template = readFileSync(join(ROOT, 'scripts/service-worker.js'), 'utf8');
writeFileSync(
  join(DIST, 'sw.js'),
  `// Generado por scripts/build-pwa.mjs. No editar.\nconst PWA = ${JSON.stringify(config)};\n\n${template}`,
);

console.log(
  `PWA: versión ${version}, ${staticPages.length} páginas, ${dynamicPages.length} dinámicas, ${assets.length} archivos.`,
);
