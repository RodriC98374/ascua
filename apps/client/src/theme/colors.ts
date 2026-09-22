// Colores del sistema de diseño para las props que no aceptan clases (íconos, degradados, gráficas).
// Mismos valores que tailwind.config.js (tema claro).
export const colors = {
  surface200: '#FAFAF9',
  surface300: '#F1F0EE',
  border: '#E0DEDA',
  ink: '#1C1917',
  inkMuted: '#57534E',
  inkFaint: '#A8A29E',
  inkOnFill: '#1C1917',
  ember: '#FF6B35',
  emberStrong: '#C2410C',
  emberGlow: '#FFB238',
  success: '#15803D',
  protegido: '#0369A1',
  error: '#C0392B',
  onError: '#FFFFFF',
  vacioSoft: '#F1F0EE',
  /** Fondo detrás de un modal: ink al 40%. */
  scrim: 'rgba(28, 25, 23, 0.4)',
} as const;

/** Degradado de marca: botón primario, casilla marcada, día perfecto. */
export const emberGradient = [colors.ember, colors.emberGlow] as const;
