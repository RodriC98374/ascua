// Documento HTML de la web (solo se ejecuta en Node, al exportar). Es el único lugar con
// elementos del DOM: no es una pantalla, es el envoltorio de todas.
import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

import { THEME_STORAGE_KEY } from '@/features/appearance/theme-preference';
import palette from '@/theme/palette.json';

// Aplica el tema guardado antes del primer pintado, igual que `apply-color-scheme.web.ts`; sin
// esto la web oscura parpadea en blanco mientras carga el JavaScript.
const themeScript = `(function () {
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var isDark = stored === 'dark' ||
      (stored !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  } catch (error) {}
})();`;

const backgroundStyle = `
html, body { background-color: ${palette.light['surface-100']}; }
html.dark, html.dark body { background-color: ${palette.dark['surface-100']}; }
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: light)"
          content={palette.light['surface-200']}
        />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: dark)"
          content={palette.dark['surface-200']}
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: backgroundStyle }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
