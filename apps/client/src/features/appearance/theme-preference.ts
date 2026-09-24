// Preferencia de tema de Ajustes. Se guarda en cada dispositivo (no en Firestore): la PC y el
// celular pueden tener uno distinto.

export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export type ColorScheme = 'light' | 'dark';

/**
 * Clave en el almacenamiento del dispositivo (AsyncStorage; en web es localStorage con esta
 * misma clave). La lee también el script de `+html.tsx` para pintar la web sin parpadeo.
 */
export const THEME_STORAGE_KEY = 'ascua.theme';

export const THEME_OPTIONS: readonly { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Automático' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];

/** Lo guardado, o Automático si no hay nada o trae algo raro. */
export function parseThemePreference(value: unknown): ThemePreference {
  return THEME_PREFERENCES.includes(value as ThemePreference)
    ? (value as ThemePreference)
    : 'system';
}

/** El tema que se ve: el elegido, o el del sistema en Automático (claro si no se sabe). */
export function resolveColorScheme(
  preference: ThemePreference,
  systemScheme: string | null | undefined,
): ColorScheme {
  if (preference !== 'system') return preference;
  return systemScheme === 'dark' ? 'dark' : 'light';
}
