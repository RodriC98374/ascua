// Gasto de puntos: compra de protectores y canje de recompensas. Funciones puras; las operaciones
// de la app las usan dentro de una transacción de Firestore y las reglas validan el resultado.
import { MAX_STREAK_FREEZES, STREAK_FREEZE_COST } from './constants';
import { spendablePoints } from './savings';
import { transactionIds } from './transaction-ids';
import type { DateKey, GamificationState, PointTransaction, Reward, SavingsJar } from './types';

export type SpendCheck =
  | { ok: true }
  | { ok: false; reason: 'insufficient_points'; missingPoints: number }
  | { ok: false; reason: 'max_freezes_reached' | 'reward_archived' };

export interface SpendPlan {
  transaction: PointTransaction;
  nextState: GamificationState;
}

function checkBalance(available: number, cost: number): SpendCheck {
  return available >= cost
    ? { ok: true }
    : { ok: false, reason: 'insufficient_points', missingPoints: cost - available };
}

/** Lo apartado en la alcancía (fase 18) no se puede gastar en un protector. */
export function canPurchaseFreeze(
  state: GamificationState,
  savings: SavingsJar | null = null,
): SpendCheck {
  if (state.streakFreezesAvailable >= MAX_STREAK_FREEZES) {
    return { ok: false, reason: 'max_freezes_reached' };
  }
  return checkBalance(spendablePoints(state.pointsBalance, savings), STREAK_FREEZE_COST);
}

/**
 * Lo apartado en la alcancía solo sirve para su propia recompensa: al canjearla, la alcancía se
 * vacía en la misma transacción y alcanza con el saldo entero.
 */
export function canRedeemReward(
  state: GamificationState,
  reward: Reward,
  savings: SavingsJar | null = null,
): SpendCheck {
  if (reward.status !== 'active') return { ok: false, reason: 'reward_archived' };
  const available =
    savings?.rewardId === reward.id
      ? state.pointsBalance
      : spendablePoints(state.pointsBalance, savings);
  return checkBalance(available, reward.cost);
}

function spend(
  state: GamificationState,
  cost: number,
  transaction: Omit<PointTransaction, 'amount' | 'balanceAfter'>,
): SpendPlan {
  const pointsBalance = state.pointsBalance - cost;
  return {
    transaction: { ...transaction, amount: -cost, balanceAfter: pointsBalance },
    nextState: {
      ...state,
      pointsBalance,
      lifetimePointsSpent: state.lifetimePointsSpent + cost,
      lastSpendTransactionId: transaction.id,
    },
  };
}

function assertAllowed(check: SpendCheck): void {
  if (!check.ok) throw new Error(check.reason);
}

/** `requestId` se genera una vez por intento y se reutiliza si hay reintento. */
export function planFreezePurchase(
  state: GamificationState,
  requestId: string,
  dateKey: DateKey,
): SpendPlan {
  assertAllowed(canPurchaseFreeze(state));
  const plan = spend(state, STREAK_FREEZE_COST, {
    id: transactionIds.freezePurchase(requestId),
    type: 'streak_freeze_purchase',
    dateKey,
    sourceType: 'streak_freeze',
    sourceId: requestId,
    description: 'Protector de racha',
  });
  return {
    ...plan,
    nextState: { ...plan.nextState, streakFreezesAvailable: state.streakFreezesAvailable + 1 },
  };
}

/** `requestId` se genera una vez por intento y se reutiliza si hay reintento. */
export function planRewardRedemption(
  state: GamificationState,
  reward: Reward,
  requestId: string,
  dateKey: DateKey,
): SpendPlan {
  assertAllowed(canRedeemReward(state, reward));
  return spend(state, reward.cost, {
    id: transactionIds.rewardRedemption(requestId),
    type: 'reward_redemption',
    dateKey,
    sourceType: 'reward_redemption',
    sourceId: requestId,
    description: `Canje: ${reward.name}`,
  });
}
