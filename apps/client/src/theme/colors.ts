// Colores del sistema de diseño para las props que no aceptan clases (íconos, degradados, gráficas,
// sombras). Salen de palette.json, la misma fuente que las clases de tailwind.config.js.
import { useColorScheme } from 'nativewind';

import palette from './palette.json';

type CamelCase<Name extends string> = Name extends `${infer Head}-${infer Tail}`
  ? `${Head}${Capitalize<CamelCase<Tail>>}`
  : Name;

export type TokenName = keyof typeof palette.light;

/** Cada token con su nombre en camelCase: 'ink-muted' → `inkMuted`, 'surface-200' → `surface200`. */
type TokenColors = { [Name in TokenName as CamelCase<Name>]: string };

export interface ThemeColors extends TokenColors {
  /** Degradado de marca: botón primario, casilla marcada, día perfecto. */
  emberGradient: readonly [string, string];
  /** Fondo detrás de un modal. */
  scrim: string;
  /** Sombra cálida de la brasa en claro (shadow-md/lg); neutra en oscuro. */
  shadowWarm: string;
  /** Sombra fina (shadow-sm). */
  shadowNeutral: string;
}

function toThemeColors(
  tokens: Record<TokenName, string>,
  extra: Pick<ThemeColors, 'scrim' | 'shadowWarm' | 'shadowNeutral'>,
): ThemeColors {
  const base = Object.fromEntries(
    Object.entries(tokens).map(([name, value]) => [
      name.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase()),
      value,
    ]),
  ) as TokenColors;
  return { ...base, emberGradient: [base.ember, base.emberGlow], ...extra };
}

export const lightColors = toThemeColors(palette.light, {
  // ink al 40 %.
  scrim: 'rgba(28, 25, 23, 0.4)',
  shadowWarm: palette.light.ember,
  shadowNeutral: palette.light.ink,
});

// En oscuro las sombras son negras y el fondo del modal más opaco: el relieve lo dan las
// superficies, que se aclaran al subir.
export const darkColors = toThemeColors(palette.dark, {
  scrim: 'rgba(0, 0, 0, 0.6)',
  shadowWarm: '#000000',
  shadowNeutral: '#000000',
});

/** El tema que se ve ahora (Automático, Claro u Oscuro según Ajustes, ya resuelto). */
export function useActiveColorScheme(): 'light' | 'dark' {
  const { colorScheme } = useColorScheme();
  return colorScheme === 'dark' ? 'dark' : 'light';
}

/** Los colores del tema que se ve ahora. */
export function useThemeColors(): ThemeColors {
  return useActiveColorScheme() === 'dark' ? darkColors : lightColors;
}
