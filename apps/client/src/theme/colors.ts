// Colores del sistema de diseño para las props que no aceptan clases (íconos, degradados, gráficas).
// Mismos valores que tailwind.config.js (tema claro).
export const colors = {
  surface200: '#FFFBF6',
  surface300: '#FDEEDF',
  border: '#F1DFCB',
  ink: '#2B1B12',
  inkMuted: '#6E6153',
  inkFaint: '#8A7862',
  inkOnFill: '#2B1B12',
  ember: '#FF6B35',
  emberStrong: '#C2410C',
  emberGlow: '#FFB238',
  success: '#15803D',
  protegido: '#0369A1',
  error: '#C0392B',
  onError: '#FFFFFF',
  vacioSoft: '#FDEEDF',
  /** Fondo detrás de un modal: ink al 40%. */
  scrim: 'rgba(43, 27, 18, 0.4)',
} as const;

/** Degradado de marca: botón primario, casilla marcada, día perfecto. */
export const emberGradient = [colors.ember, colors.emberGlow] as const;
