// Escrituras rechazadas: nunca se ignoran. Las operaciones no se esperan en la UI (sin conexión
// quedan en cola), así que su error llega tarde; aquí se guarda el último para mostrarlo.
import { useSyncExternalStore } from 'react';

type Listener = () => void;

let currentError: string | null = null;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

function messageFor(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : null;
  if (code === 'permission-denied') {
    return 'No se pudo guardar un cambio: el servidor lo rechazó. Si fue una marca de un día que ya terminó, ya no se puede cambiar.';
  }
  return 'No se pudo guardar un cambio. Vuelve a intentarlo.';
}

/** Deja correr la escritura y, si falla, avisa al usuario. */
export function trackWrite(write: Promise<unknown>): void {
  write.catch((error: unknown) => {
    console.error('Escritura rechazada', error);
    currentError = messageFor(error);
    emit();
  });
}

export function dismissWriteError(): void {
  currentError = null;
  emit();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useWriteError(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => currentError,
    () => currentError,
  );
}
