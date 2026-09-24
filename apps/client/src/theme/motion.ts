// Ritmo de las animaciones: toda la app comparte duraciones y resortes. Con "reducir movimiento"
// activado en el sistema, Reanimated salta cada animación a su valor final (ReduceMotion.System).
import { Easing, type WithSpringConfig } from 'react-native-reanimated';

export const DURATION = {
  /** Respuesta al toque. */
  fast: 120,
  /** Cambios de estado (deslizar, aparecer). */
  base: 200,
  /** Entradas con más recorrido. */
  slow: 320,
} as const;

/** Encender algo: sube un poco de más y se asienta, como una brasa que se aviva. */
export const SPRING_POP: WithSpringConfig = { damping: 11, stiffness: 260, mass: 0.7 };

/** Deslizar sin rebote que se note: pastilla del control segmentado, interruptor, soltar un toque. */
export const SPRING_SOFT: WithSpringConfig = { damping: 20, stiffness: 240 };

export const EASE_OUT = Easing.out(Easing.cubic);
