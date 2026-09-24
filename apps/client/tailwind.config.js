/** @type {import('tailwindcss').Config} */
// Tokens del sistema de diseño "Brasa Viva" (.claude/plan/01-design-system.md).
// Los colores salen de src/theme/palette.json, la misma fuente que usan las props que no aceptan
// clases (src/theme/colors.ts). Cada color es una variable CSS con un valor por tema: la clase
// `bg-surface-100` cambia sola al pasar a oscuro, sin pares `dark:` (decisión D17).
const plugin = require('tailwindcss/plugin');

const palette = require('./src/theme/palette.json');

/** '#FF6B35' → '255 107 53', para poder usar `<alpha-value>`. */
function toChannels(hex) {
  const value = parseInt(hex.slice(1), 16);
  return `${(value >> 16) & 255} ${(value >> 8) & 255} ${value & 255}`;
}

function cssVariables(theme) {
  return Object.fromEntries(
    Object.entries(theme).map(([name, hex]) => [`--color-${name}`, toChannels(hex)]),
  );
}

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // La app elige el tema (Automático / Claro / Oscuro en Ajustes) y NativeWind lo aplica.
  darkMode: 'class',
  theme: {
    extend: {
      colors: Object.fromEntries(
        Object.keys(palette.light).map((name) => [
          name,
          `rgb(var(--color-${name}) / <alpha-value>)`,
        ]),
      ),
      // Un archivo por peso (@expo-google-fonts), cargados en src/app/_layout.tsx.
      fontFamily: {
        heading: ['Baloo2_700Bold'],
        'heading-extrabold': ['Baloo2_800ExtraBold'],
        'heading-medium': ['Baloo2_500Medium'],
        body: ['Nunito_400Regular'],
        'body-semibold': ['Nunito_600SemiBold'],
        'body-bold': ['Nunito_700Bold'],
        'body-extrabold': ['Nunito_800ExtraBold'],
      },
      fontSize: {
        'display-lg': ['40px', { lineHeight: '44px' }],
        'display-md': ['28px', { lineHeight: '32px' }],
        'heading-lg': ['22px', { lineHeight: '28px' }],
        'heading-md': ['18px', { lineHeight: '24px' }],
        'heading-sm': ['15px', { lineHeight: '20px' }],
        body: ['14px', { lineHeight: '20px' }],
        caption: ['12px', { lineHeight: '16px' }],
        label: ['11px', { lineHeight: '14px', letterSpacing: '0.04em' }],
        button: ['15px', { lineHeight: '20px' }],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '18px',
        xl: '24px',
        full: '999px',
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ':root': cssVariables(palette.light),
        '.dark:root': cssVariables(palette.dark),
      });
    }),
  ],
};
