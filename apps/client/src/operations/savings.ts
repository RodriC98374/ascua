// Alcancía (fase 18, D25): apartar puntos para una recompensa. Los puntos siguen en el saldo, pero
// las reglas de gasto no dejan tocarlos. Apartar lee el saldo, así que va en una transacción; se
// aparta sin movimiento en el historial (el gasto real es el canje, en `spending.ts`).
import { EMPTY_SAVINGS, maxSavingsDeposit, todayDateKey, type DateKey } from '@ascua/shared';
import { runTransaction, serverTimestamp, updateDoc, type Firestore } from 'firebase/firestore';

import { gamificationRef, newDocumentFields, rewardRef, savingsRef } from '../data/documents';

export class SavingsNotAllowedError extends Error {
  constructor(
    readonly reason: 'reward_archived' | 'other_reward' | 'over_limit',
    /** Lo máximo que se podía apartar en ese momento. */
    readonly maxDeposit = 0,
  ) {
    super(reason);
    this.name = 'SavingsNotAllowedError';
  }
}

export interface DepositInput {
  rewardId: string;
  /** Puntos a sumar a la alcancía; más de 0. */
  amount: number;
}

/**
 * Aparta puntos para la recompensa. Sin alcancía, la empieza hoy; con una para la misma
 * recompensa, le suma. Para otra recompensa, primero hay que cancelar la actual.
 */
export function depositSavings(
  db: Firestore,
  uid: string,
  { rewardId, amount }: DepositInput,
  today: DateKey = todayDateKey(),
): Promise<void> {
  return runTransaction(db, async (transaction) => {
    const state = (await transaction.get(gamificationRef(db, uid))).data();
    const reward = (await transaction.get(rewardRef(db, uid, rewardId))).data();
    const savingsSnapshot = await transaction.get(savingsRef(db, uid));
    if (!state) throw new Error('La cuenta no tiene estado de puntos.');
    if (!reward) throw new Error(`No existe la recompensa ${rewardId}.`);
    if (reward.status !== 'active') throw new SavingsNotAllowedError('reward_archived');

    const jar = savingsSnapshot.data() ?? EMPTY_SAVINGS;
    if (jar.rewardId !== null && jar.rewardId !== rewardId) {
      throw new SavingsNotAllowedError('other_reward');
    }
    const current = jar.rewardId === rewardId ? jar : null;
    const max = maxSavingsDeposit({
      balance: state.pointsBalance,
      jar: current,
      cost: reward.cost,
    });
    if (!Number.isInteger(amount) || amount <= 0 || amount > max) {
      throw new SavingsNotAllowedError('over_limit', max);
    }

    const next = {
      rewardId,
      points: (current?.points ?? 0) + amount,
      startedDateKey: current?.startedDateKey ?? today,
    };
    const ref = savingsRef(db, uid).withConverter(null);
    if (savingsSnapshot.exists()) {
      transaction.update(ref, { ...next, updatedAt: serverTimestamp() });
    } else {
      transaction.set(ref, { ...next, ...newDocumentFields() });
    }
  });
}

/** Vacía la alcancía: los puntos vuelven a estar disponibles. */
export function cancelSavings(db: Firestore, uid: string): Promise<void> {
  return updateDoc(savingsRef(db, uid).withConverter(null), {
    ...EMPTY_SAVINGS,
    updatedAt: serverTimestamp(),
  });
}
