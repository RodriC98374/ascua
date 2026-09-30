// Alcancía (fase 18, D25): puntos reservados para una recompensa. Siguen en el saldo, pero nada
// puede gastarlos: los "puntos para gastar" son el saldo menos lo apartado. Solo suben; cancelar
// la vacía y el canje de su recompensa también.
import type { SavingsJar } from './types';

/** Sin alcancía: así queda el documento al cancelar o canjear. */
export const EMPTY_SAVINGS: SavingsJar = { rewardId: null, points: 0, startedDateKey: null };

/** Lo que se puede gastar: el saldo sin lo apartado. */
export function spendablePoints(balance: number, jar: SavingsJar | null): number {
  return Math.max(0, balance - (jar?.points ?? 0));
}

/** Lo máximo que se puede apartar ahora: lo que falta para el costo, sin pasar del saldo libre. */
export function maxSavingsDeposit({
  balance,
  jar,
  cost,
}: {
  balance: number;
  jar: SavingsJar | null;
  cost: number;
}): number {
  const saved = jar?.points ?? 0;
  return Math.max(0, Math.min(cost - saved, balance - saved));
}

/** Ya alcanza para canjear su recompensa. */
export function isSavingsComplete(jar: SavingsJar, cost: number): boolean {
  return jar.rewardId !== null && jar.points >= cost;
}
