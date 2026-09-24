// Siembra los datos de ejemplo en los emuladores ya encendidos (sin abrir la web).
//
// Uso: `npm run emulators` en una terminal y, en otra, `npm run seed:demo` (acepta las mismas
// opciones que `npm run demo`, p. ej. `npm run seed:demo -- --streak=6`).
import { parseDemoOptions, seedDemo } from './demo-data';

async function main() {
  await seedDemo(parseDemoOptions(process.argv.slice(2)));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
