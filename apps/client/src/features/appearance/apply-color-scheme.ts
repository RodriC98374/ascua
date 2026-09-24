import { colorScheme } from 'nativewind';

import type { ThemePreference } from './theme-preference';

/**
 * Android: NativeWind lo pasa a `Appearance.setColorScheme`, así que Automático sigue al sistema
 * por sí solo y la barra de estado y los componentes nativos cambian con la app.
 * Devuelve cómo dejar de escuchar (aquí no hay nada que escuchar).
 */
export function applyColorScheme(preference: ThemePreference): () => void {
  colorScheme.set(preference);
  return () => {};
}
