import { colorScheme } from 'nativewind';

import { resolveColorScheme, type ThemePreference } from './theme-preference';

/**
 * Web: el tema es la clase `dark` en `<html>` (tailwind.config.js, `darkMode: 'class'`). En
 * Automático se resuelve con la media query del navegador y se sigue escuchando: si el sistema
 * cambia de tema con la pestaña abierta, la app cambia con él.
 */
export function applyColorScheme(preference: ThemePreference): () => void {
  const media = window.matchMedia('(prefers-color-scheme: dark)');

  function apply() {
    const scheme = resolveColorScheme(preference, media.matches ? 'dark' : 'light');
    const root = document.documentElement;
    root.classList.toggle('dark', scheme === 'dark');
    // Barras de desplazamiento y controles del navegador en el mismo tema.
    root.style.colorScheme = scheme;
    colorScheme.set(scheme);
  }

  apply();
  if (preference !== 'system') return () => {};
  media.addEventListener('change', apply);
  return () => media.removeEventListener('change', apply);
}
