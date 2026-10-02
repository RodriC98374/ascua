// Política de reintento del cierre de días. Pura (sin React ni Firebase) para poder probarla.
// El cierre falla con `unavailable` justo al volver la app del fondo, mientras Firestore reconecta:
// no es un error del usuario, así que se reintenta solo en vez de quedarse esperando.

/** Cuánto esperar antes de cada reintento, en orden. Pasado el último, se avisa al usuario. */
export const CLOSING_RETRY_DELAYS_MS = [2_000, 5_000, 15_000, 30_000] as const;

/** Si el cierre no responde en este tiempo, se da por perdido y se reintenta. */
export const CLOSING_TIMEOUT_MS = 20_000;

/** Espera antes del próximo reintento tras `failures` fallos seguidos; null cuando ya no quedan. */
export function closingRetryDelayMs(failures: number): number | null {
  return CLOSING_RETRY_DELAYS_MS[failures] ?? null;
}

/**
 * Corta una espera que no termina. Con la conexión a medias, una transacción de Firestore puede
 * quedarse colgada sin fallar nunca; el rechazo lleva `code: 'unavailable'` para tratarlo igual
 * que una conexión caída. Reintentar es seguro: el cierre avanza `lastClosedDateKey` dentro de su
 * transacción, así que si la colgada termina después, el reintento sigue con el día siguiente.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () =>
        reject(
          Object.assign(new Error('El cierre no respondió a tiempo.'), { code: 'unavailable' }),
        ),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
