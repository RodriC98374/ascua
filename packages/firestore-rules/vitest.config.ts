import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Todos los archivos comparten el mismo emulador: en serie para que no se pisen los datos.
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
