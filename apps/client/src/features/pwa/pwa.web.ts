// Web instalable (fase 19, D26): registra el service worker de la web publicada y guarda el aviso
// de instalación del navegador para ofrecerlo desde Ajustes. El service worker lo genera
// `scripts/build-pwa.mjs` al exportar; en desarrollo no existe y no se registra.
import { useSyncExternalStore } from 'react';

/** El evento `beforeinstallprompt` de Chrome y Edge (todavía no está en los tipos del DOM). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function setPrompt(prompt: BeforeInstallPromptEvent | null) {
  deferredPrompt = prompt;
  for (const listener of listeners) listener();
}

/** Se llama una vez al cargar la app, antes de que el navegador ofrezca instalarla. */
export function startPwa(): void {
  // Al exportar, este módulo también corre en Node: sin ventana no hay nada que hacer.
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (event) => {
    // Sin esto el navegador muestra su propio aviso; se ofrece desde Ajustes.
    event.preventDefault();
    setPrompt(event as BeforeInstallPromptEvent);
  });
  window.addEventListener('appinstalled', () => setPrompt(null));

  if (!__DEV__ && 'serviceWorker' in navigator) {
    // Después de cargar la página: guardar la app al instalarse no compite con abrirla.
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
        console.error('No se pudo registrar el service worker', error);
      });
    };
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }
}

export interface InstallPrompt {
  install: () => Promise<void>;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Instalar como app, si el navegador lo ofrece ahora (Chrome y Edge, y todavía sin instalar). */
export function useInstallPrompt(): InstallPrompt | null {
  const prompt = useSyncExternalStore(
    subscribe,
    () => deferredPrompt,
    () => null,
  );
  if (!prompt) return null;
  return {
    install: async () => {
      // El aviso sirve una sola vez; si lo rechaza, el navegador lo vuelve a ofrecer más adelante.
      setPrompt(null);
      await prompt.prompt();
      await prompt.userChoice;
    },
  };
}
