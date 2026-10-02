// Trofeos (fase 21): cada canje queda como un logro, aparte del historial de puntos. Uno queda
// "por usar" hasta que se marca "Utilizado".
import type { RewardRedemption } from './types';

export interface TrophyShelf {
  /** Del canje más reciente al más antiguo; dentro de un día, en el orden recibido. */
  trophies: RewardRedemption[];
  /** Canjes que todavía no se marcaron como usados. */
  unusedCount: number;
}

export function trophyShelf(redemptions: readonly RewardRedemption[]): TrophyShelf {
  // `sort` es estable: los del mismo día conservan el orden de llegada (el más nuevo primero).
  const trophies = [...redemptions].sort((a, b) =>
    a.dateKey === b.dateKey ? 0 : a.dateKey < b.dateKey ? 1 : -1,
  );
  const unusedCount = redemptions.filter((item) => item.usedDateKey === null).length;
  return { trophies, unusedCount };
}
