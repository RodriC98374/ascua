// Demo local en un solo comando: enciende los emuladores de Auth y Firestore (si no lo están),
// siembra los datos de ejemplo y abre la web de desarrollo conectada a ellos. Nunca habla con el
// proyecto real: los datos viven en la memoria de los emuladores y desaparecen al cerrar la demo.
//
// Uso: `npm run demo`, o con opciones: `npm run demo -- --streak=6 --risk` (ver DEMO_USAGE).
// Necesita Java 21+ en el PATH, como `npm run emulators`.
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { AUTH_PORT, FIRESTORE_PORT, HOST, parseDemoOptions, seedDemo } from './demo-data';

const ROOT = new URL('../../../', import.meta.url);
const CLIENT_DIR = fileURLToPath(new URL('apps/client/', ROOT));
/** Distinto del 8081 de `npm run web` (producción), para que el navegador no mezcle sus cachés. */
const WEB_PORT = 8082;
const EMULATOR_UI_PORT = 4000;
const READY_TIMEOUT_MS = 90_000;
const LOG_TAIL_LINES = 30;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** El ejecutable JS de un paquete, para lanzarlo con este mismo Node (sin shell ni `.cmd`). */
function binPath(pkg: string, bin: string): string {
  const manifestPath = createRequire(new URL('package.json', ROOT)).resolve(`${pkg}/package.json`);
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
    bin: string | Record<string, string>;
  };
  const relative = typeof manifest.bin === 'string' ? manifest.bin : manifest.bin[bin];
  if (!relative) throw new Error(`${pkg} no tiene el ejecutable ${bin}.`);
  return join(dirname(manifestPath), relative);
}

async function isListening(port: number): Promise<boolean> {
  try {
    await fetch(`http://${HOST}:${port}/`, { signal: AbortSignal.timeout(1500) });
    return true;
  } catch {
    return false;
  }
}

/**
 * Si otro proceso ya ocupa el puerto. Se prueba ocupándolo, como hace Expo: un servidor de Metro
 * puede tardar más de lo que `isListening` espera en responder.
 */
function isPortTaken(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer()
      .once('error', () => resolve(true))
      .once('listening', () => server.close(() => resolve(false)))
      .listen(port);
  });
}

function hasExited(child: ChildProcess): boolean {
  return child.exitCode !== null || child.signalCode !== null;
}

/** Cierra un proceso y sus hijos (en Windows, el Java de Firestore no cae con el proceso padre). */
function stopTree(child: ChildProcess) {
  if (hasExited(child) || child.pid === undefined) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    child.kill('SIGINT');
  }
}

/** Enciende los emuladores y espera a que respondan; null si ya estaban encendidos. */
async function startEmulators(): Promise<ChildProcess | null> {
  const [isFirestoreUp, isAuthUp] = await Promise.all([
    isListening(FIRESTORE_PORT),
    isListening(AUTH_PORT),
  ]);
  if (isFirestoreUp && isAuthUp) {
    console.log('Los emuladores ya estaban encendidos: uso esos.');
    return null;
  }
  if (isFirestoreUp || isAuthUp) {
    throw new Error('Solo uno de los emuladores responde. Apágalos y vuelve a intentar.');
  }

  console.log('Encendiendo los emuladores de Auth y Firestore…');
  const child = spawn(
    process.execPath,
    [binPath('firebase-tools', 'firebase'), 'emulators:start', '--only', 'auth,firestore'],
    { cwd: fileURLToPath(ROOT), stdio: ['ignore', 'pipe', 'pipe'] },
  );
  // Su salida no se muestra (taparía la de Expo), pero se guarda la cola para explicar un fallo.
  const tail: string[] = [];
  const collect = (chunk: Buffer) => {
    tail.push(...chunk.toString().split(/\r?\n/).filter(Boolean));
    tail.splice(0, Math.max(0, tail.length - LOG_TAIL_LINES));
  };
  child.stdout?.on('data', collect);
  child.stderr?.on('data', collect);

  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (hasExited(child)) {
      throw new Error(
        `Los emuladores no arrancaron. ¿Hay Java 21+ en el PATH?\n${tail.join('\n')}`,
      );
    }
    if ((await isListening(FIRESTORE_PORT)) && (await isListening(AUTH_PORT))) {
      child.once('exit', () => {
        console.error(`\nLos emuladores se cerraron:\n${tail.join('\n')}`);
      });
      return child;
    }
    await sleep(500);
  }
  stopTree(child);
  throw new Error(
    `Los emuladores no respondieron en ${READY_TIMEOUT_MS / 1000} s.\n${tail.join('\n')}`,
  );
}

async function main() {
  const options = parseDemoOptions(process.argv.slice(2));
  // Antes de tocar nada: con el puerto ocupado Expo no arranca, y sembrar pisaría los datos de
  // una demo que ya está abierta.
  if (await isPortTaken(WEB_PORT)) {
    throw new Error(
      `El puerto ${WEB_PORT} ya está en uso: ¿hay otra demo abierta? Ciérrala con Ctrl+C y vuelve a intentar.`,
    );
  }
  let emulators: ChildProcess | null = null;
  let web: ChildProcess | null = null;

  const stopEmulators = () => {
    if (!emulators) return;
    emulators.removeAllListeners('exit');
    stopTree(emulators);
  };
  const shutdown = (code: number) => {
    stopEmulators();
    process.exit(code);
  };
  // Con la web abierta, el Ctrl+C lo recibe Expo y su cierre apaga los emuladores (abajo).
  process.on('SIGINT', () => {
    if (!web) shutdown(130);
  });

  emulators = await startEmulators();
  try {
    await seedDemo(options);
  } catch (error) {
    stopEmulators();
    throw error;
  }

  console.log(
    [
      '',
      `Demo en http://localhost:${WEB_PORT} (se abre sola cuando Expo termina de compilar).`,
      `Datos en vivo: http://${HOST}:${EMULATOR_UI_PORT}. Ctrl+C cierra la demo y borra sus datos.`,
      '',
    ].join('\n'),
  );
  web = spawn(
    process.execPath,
    [binPath('expo', 'expo'), 'start', '--web', '--port', String(WEB_PORT)],
    {
      cwd: CLIENT_DIR,
      stdio: 'inherit',
      env: { ...process.env, EXPO_PUBLIC_USE_EMULATORS: 'true' },
    },
  );
  web.once('exit', (code) => {
    console.log(
      emulators
        ? 'Demo cerrada: emuladores apagados, sus datos ya no existen.'
        : 'Demo cerrada. Los emuladores siguen encendidos, como estaban.',
    );
    shutdown(code ?? 0);
  });
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
