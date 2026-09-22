// Historial de puntos para mostrar: movimientos agrupados por día, con la nota de cada canje.
import {
  formatLongDate,
  type DateKey,
  type PointTransaction,
  type RewardRedemption,
} from '@ascua/shared';

export interface HistoryItem {
  id: string;
  description: string;
  /** Con signo y el menos tipográfico: '+10', '−550'. */
  amount: string;
  isGain: boolean;
  note: string | null;
}

export interface HistoryDay {
  dateKey: DateKey;
  title: string;
  items: HistoryItem[];
}

/** Respeta el orden recibido (el más reciente primero). */
export function historyByDay(
  movements: readonly PointTransaction[],
  redemptions: readonly RewardRedemption[],
): HistoryDay[] {
  const notes = new Map(
    redemptions.map((redemption) => [redemption.pointTransactionId, redemption.note]),
  );
  const days: HistoryDay[] = [];
  for (const movement of movements) {
    let day = days.at(-1);
    if (day?.dateKey !== movement.dateKey) {
      day = { dateKey: movement.dateKey, title: formatLongDate(movement.dateKey), items: [] };
      days.push(day);
    }
    const isGain = movement.amount >= 0;
    day.items.push({
      id: movement.id,
      description: movement.description,
      amount: isGain ? `+${movement.amount}` : `−${Math.abs(movement.amount)}`,
      isGain,
      note: notes.get(movement.id) ?? null,
    });
  }
  return days;
}
