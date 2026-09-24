// Genera los íconos de Ascua (la brasa del sistema de diseño, `EmberIcon`) como PNG en
// assets/images, dibujándolos con Edge headless (Windows). Uso, desde apps/client:
//   node scripts/generate-icons.mjs            todos
//   ONLY=favicon.png node scripts/generate-icons.mjs
// Edge no baja de cierto ancho de ventana: por eso el favicon es de 192 px y no de 48.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../assets/images');
const WORK = mkdtempSync(join(tmpdir(), 'ascua-icons-'));
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

const FLAME =
  'M12 2.4c.5 2.3-1 3.6-2.1 5-1.2 1.5-1.9 2.9-1.9 4.9a4 4 0 008 0c0-1-.3-1.9-.8-2.6.2.8 0 1.7-.9 2-.9.3-1.5-.5-1.2-1.3.7-1.7 1.9-2.2 1.9-4.3 0-1.6-1.2-3-3-3.7z';
// Caja del glifo en su lienzo de 24: x 8–16, y 2.4–16.3.
const FLAME_CENTER = { x: 12, y: 9.35 };
const FLAME_HEIGHT = 13.9;

const INK = '#1C1917';
const EMBER = '#FF6B35';
const GLOW = '#FFB238';

function flame({ size, heightRatio, fill, offsetY = 0 }) {
  const scale = (size * heightRatio) / FLAME_HEIGHT;
  const cx = size / 2;
  const cy = size / 2 + offsetY * size;
  return `<g transform="translate(${cx} ${cy}) scale(${scale}) translate(${-FLAME_CENTER.x} ${-FLAME_CENTER.y})"><path d="${FLAME}" fill="${fill}"/></g>`;
}

const gradientDefs = `<defs>
  <linearGradient id="ember" x1="0.2" y1="0" x2="0.8" y2="1">
    <stop offset="0" stop-color="${EMBER}"/>
    <stop offset="1" stop-color="${GLOW}"/>
  </linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.62" r="0.55">
    <stop offset="0" stop-color="${EMBER}" stop-opacity="0.38"/>
    <stop offset="0.6" stop-color="${EMBER}" stop-opacity="0.08"/>
    <stop offset="1" stop-color="${EMBER}" stop-opacity="0"/>
  </radialGradient>
</defs>`;

function darkBackground(size, radius = 0) {
  return `<rect width="${size}" height="${size}" rx="${radius}" fill="${INK}"/><rect width="${size}" height="${size}" rx="${radius}" fill="url(#glow)"/>`;
}

const assets = [
  // Ícono completo (web y respaldo): fondo oscuro con brillo y brasa en degradado.
  {
    name: 'icon.png',
    size: 1024,
    body: (s) => darkBackground(s) + flame({ size: s, heightRatio: 0.54, fill: 'url(#ember)' }),
  },
  // Ícono adaptativo de Android: el sistema recorta un círculo o squircle de ~66 % del lienzo.
  {
    name: 'android-icon-background.png',
    size: 512,
    body: (s) => darkBackground(s),
  },
  {
    name: 'android-icon-foreground.png',
    size: 512,
    body: (s) => flame({ size: s, heightRatio: 0.4, fill: 'url(#ember)' }),
  },
  // Íconos temáticos de Android 13+: solo cuenta el alfa.
  {
    name: 'android-icon-monochrome.png',
    size: 432,
    body: (s) => flame({ size: s, heightRatio: 0.4, fill: '#FFFFFF' }),
  },
  // Ícono chico de la notificación: blanco sobre transparente, llenando casi todo el lienzo.
  {
    name: 'notification-icon.png',
    size: 96,
    body: (s) => flame({ size: s, heightRatio: 0.86, fill: '#FFFFFF' }),
  },
  // Splash: la brasa sola; el fondo lo pone app.json (claro u oscuro según el sistema).
  {
    name: 'splash-icon.png',
    size: 512,
    body: (s) => flame({ size: s, heightRatio: 0.92, fill: 'url(#ember)' }),
  },
  {
    name: 'favicon.png',
    size: 192,
    body: (s) => darkBackground(s, 40) + flame({ size: s, heightRatio: 0.66, fill: 'url(#ember)' }),
  },
];

for (const asset of assets.filter((a) => !process.env.ONLY || a.name === process.env.ONLY)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${asset.size}" height="${asset.size}" viewBox="0 0 ${asset.size} ${asset.size}">${gradientDefs}${asset.body(asset.size)}</svg>`;
  const html = join(WORK, asset.name.replace('.png', '.html'));
  writeFileSync(
    html,
    `<!doctype html><html><head><style>html,body{margin:0;background:transparent;overflow:hidden}svg{display:block}</style></head><body>${svg}</body></html>`,
  );
  execFileSync(EDGE, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--default-background-color=00000000',
    `--window-size=${asset.size},${asset.size}`,
    `--screenshot=${resolve(OUT, asset.name)}`,
    'file:///' + html.replace(/\\/g, '/'),
  ]);
  console.log('ok', asset.name);
}
rmSync(WORK, { recursive: true, force: true });
