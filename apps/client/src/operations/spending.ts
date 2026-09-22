// Gasto de puntos: comprar un protector y canjear una recompensa. Transacciones que las reglas
// validan (el descuento debe tener su movimiento con el monto exacto). La lógica de negocio es
// `planFreezePurchase` / `planRewardRedemption` de @ascua/shared.
//
// Idempotencia: el `requestId` se genera una vez por intento y se reutiliza si hay reintento. El ID
// del movimiento sale de él, así que repetir la operación nunca cobra dos veces.
import {
  addMonthlySpending,
  canPurchaseFreeze,
  canRedeemReward,
  EMPTY_MONTHLY_COUNTERS,
  planFreezePurchase,
  planRewardRedemption,
  todayDateKey,
  toMonthKey,
  transactionIds,
  type DateKey,
  type GamificationState,
  type SpendCheck,
  type SpendPlan,
} from '@ascua/shared';
import {
  getDocFromServer,
  runTransaction,
  serverTimestamp,
  type Firestore,
  type Transaction,
} from 'firebase/firestore';

import {
  gamificationRef,
  monthlySummaryRef,
  newDocumentFields,
  pointTransactionRef,
  redemptionRef,
  rewardRef,
} from '../data/documents';

export type SpendResult = 'done' | 'already_done';

/** La compra o el canje no corresponde (saldo, máximo de protectores, recompensa archivada). */
export class SpendNotAllowedError extends Error {
  constructor(readonly check: Exclude<SpendCheck, { ok: true }>) {
    super(check.reason);
    this.name = 'SpendNotAllowedError';
  }
}

function assertAllowed(check: SpendCheck): void {
  if (!check.ok) throw new SpendNotAllowedError(check);
}

export function purchaseStreakFreeze(
  db: Firestore,
  uid: string,
  requestId: string,
  today: DateKey = todayDateKey(),
): Promise<SpendResult> {
  const transactionId = transactionIds.freezePurchase(requestId);
  return runSpend(db, uid, transactionId, async (transaction) => {
    const state = await readState(transaction, db, uid);
    const month = await readMonth(transaction, db, uid, today);
    assertAllowed(canPurchaseFreeze(state));
    writeSpend(transaction, db, uid, planFreezePurchase(state, requestId, today), month, today);
  });
}

export interface RedeemInput {
  requestId: string;
  rewardId: string;
  note: string | null;
}

export function redeemReward(
  db: Firestore,
  uid: string,
  { requestId, rewardId, note }: RedeemInput,
  today: DateKey = todayDateKey(),
): Promise<SpendResult> {
  const transactionId = transactionIds.rewardRedemption(requestId);
  return runSpend(db, uid, transactionId, async (transaction) => {
    const state = await readState(transaction, db, uid);
    const reward = (await transaction.get(rewardRef(db, uid, rewardId))).data();
    const month = await readMonth(transaction, db, uid, today);
    if (!reward) throw new Error(`No existe la recompensa ${rewardId}.`);
    assertAllowed(canRedeemReward(state, reward));

    const plan = planRewardRedemption(state, reward, requestId, today);
    writeSpend(transaction, db, uid, plan, month, today);
    const trimmedNote = note?.trim() ?? '';
    transaction.set(redemptionRef(db, uid, requestId).withConverter(null), {
      rewardId,
      rewardSnapshot: { name: reward.name, tier: reward.tier, cost: reward.cost },
      pointTransactionId: plan.transaction.id,
      dateKey: today,
      redeemedAt: serverTimestamp(),
      note: trimmedNote || null,
      ...newDocumentFields(),
    });
  });
}

/**
 * Corre el gasto salvo que su movimiento ya exista (reintento). Si dos intentos con el mismo
 * `requestId` compiten, las reglas rechazan al segundo (el movimiento ya existe); se reconoce
 * mirando en el servidor si el movimiento quedó escrito.
 */
async function runSpend(
  db: Firestore,
  uid: string,
  transactionId: string,
  spend: (transaction: Transaction) => Promise<void>,
): Promise<SpendResult> {
  const movementRef = pointTransactionRef(db, uid, transactionId).withConverter(null);
  try {
    return await runTransaction(db, async (transaction) => {
      if ((await transaction.get(movementRef)).exists()) return 'already_done';
      await spend(transaction);
      return 'done';
    });
  } catch (error) {
    const code = (error as { code?: unknown } | null)?.code;
    if (code === 'permission-denied' && (await getDocFromServer(movementRef)).exists()) {
      return 'already_done';
    }
    throw error;
  }
}

async function readState(transaction: Transaction, db: Firestore, uid: string) {
  const state = (await transaction.get(gamificationRef(db, uid))).data();
  if (!state) throw new Error('La cuenta no tiene estado de puntos.');
  return state;
}

function readMonth(transaction: Transaction, db: Firestore, uid: string, today: DateKey) {
  return transaction
    .get(monthlySummaryRef(db, uid, toMonthKey(today)))
    .then((snapshot) => snapshot.data());
}

/** Movimiento, estado y `pointsSpent` del mes de hoy, en la misma transacción. */
function writeSpend(
  transaction: Transaction,
  db: Firestore,
  uid: string,
  { transaction: movement, nextState }: SpendPlan,
  month: Awaited<ReturnType<typeof readMonth>>,
  today: DateKey,
): void {
  const { id, ...fields } = movement;
  transaction.set(pointTransactionRef(db, uid, id).withConverter(null), {
    ...fields,
    ...newDocumentFields(),
  });
  transaction.update(gamificationRef(db, uid).withConverter(null), {
    ...(nextState satisfies GamificationState),
    updatedAt: serverTimestamp(),
  });

  const monthKey = toMonthKey(today);
  const monthRef = monthlySummaryRef(db, uid, monthKey).withConverter(null);
  if (month) {
    const { monthKey: _monthKey, ...counters } = month;
    transaction.update(monthRef, {
      ...addMonthlySpending(counters, movement.amount),
      updatedAt: serverTimestamp(),
    });
  } else {
    transaction.set(monthRef, {
      monthKey,
      ...addMonthlySpending(EMPTY_MONTHLY_COUNTERS, movement.amount),
      ...newDocumentFields(),
    });
  }
}
