// Deslizar una fila de Hoy hacia la derecha la marca o la desmarca, igual que tocarla. Estas
// funciones corren en el hilo de la interfaz (worklets) mientras el dedo se mueve.

export const SWIPE = {
  /** Recorrido horizontal antes de que el gesto se active: por debajo, gana el toque. */
  activationDistance: 16,
  /** Si el dedo se mueve esto en vertical antes de activarse, gana el scroll. */
  verticalTolerance: 12,
  /** Umbral para marcar: esta fracción del ancho de la fila, sin pasar de `maxThreshold`. */
  thresholdRatio: 0.35,
  maxThreshold: 120,
  /** Pasado el umbral, la fila sigue al dedo con resistencia. */
  overdragResistance: 0.3,
  /** Un deslizamiento rápido (px/s) marca desde la mitad del umbral. */
  flingVelocity: 800,
} as const;

/** Distancia a la que soltar marca, según el ancho de la fila. */
export function swipeThreshold(rowWidth: number): number {
  'worklet';
  return Math.min(rowWidth * SWIPE.thresholdRatio, SWIPE.maxThreshold);
}

/** Dónde se dibuja la fila: nunca a la izquierda, y con resistencia pasado el umbral. */
export function swipeOffset(translationX: number, threshold: number): number {
  'worklet';
  if (translationX <= 0) return 0;
  if (translationX <= threshold) return translationX;
  return threshold + (translationX - threshold) * SWIPE.overdragResistance;
}

/** Si al soltar se marca (o desmarca): pasó el umbral, o fue rápido y llegó a la mitad. */
export function isSwipeCommitted(
  translationX: number,
  velocityX: number,
  threshold: number,
): boolean {
  'worklet';
  if (translationX >= threshold) return true;
  return translationX >= threshold / 2 && velocityX >= SWIPE.flingVelocity;
}
