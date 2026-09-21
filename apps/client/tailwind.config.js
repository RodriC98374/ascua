/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    // Los tokens del sistema de diseño (fase 01) se agregan aquí.
    extend: {},
  },
  plugins: [],
};
