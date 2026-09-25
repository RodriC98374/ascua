// Documentos tal como los escribirá la app. Las operaciones de cierre y gasto usan la lógica real
// de `@ascua/shared`: así se prueba que lo que calcula la app pasa las reglas.
import {
  addClosedDay,
  addDays,
  addMonthlySpending,
  EMPTY_MONTHLY_COUNTERS,
  evaluateDay,
  initialGamificationState,
  planFreezePurchase,
  planRewardRedemption,
  todayDateKey,
  toMonthKey,
  type DailyEntries,
  type DayEvaluation,
  type GamificationState,
  type Habit,
  type HabitTier,
  type MonthKey,
  type MonthlyCounters,
  type PointTransaction,
  type Reward,
  type Task,
  type TaskSize,
} from '@ascua/shared';
import {
  doc,
  serverTimestamp,
  setDoc,
  writeBatch,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore';

import { OWNER, OWNER_EMAIL, seed } from './env';

// "Hoy" según el reloj real: las reglas usan la hora del servidor y el emulador no permite fijarla.
// El borde de medianoche se prueba con las sondas de `date-helpers.test.ts`.
export const TODAY = todayDateKey();
export const YESTERDAY = addDays(TODAY, -1);
export const TWO_DAYS_AGO = addDays(TODAY, -2);
export const TOMORROW = addDays(TODAY, 1);

export const paths = {
  user: (uid = OWNER) => `users/${uid}`,
  habit: (id: string, uid = OWNER) => `users/${uid}/habits/${id}`,
  reward: (id: string, uid = OWNER) => `users/${uid}/rewards/${id}`,
  dailyLog: (dateKey: string, uid = OWNER) => `users/${uid}/dailyLogs/${dateKey}`,
  monthlySummary: (monthKey: string, uid = OWNER) => `users/${uid}/monthlySummaries/${monthKey}`,
  gamification: (uid = OWNER) => `users/${uid}/meta/gamification`,
  transaction: (id: string, uid = OWNER) => `users/${uid}/pointTransactions/${id}`,
  redemption: (id: string, uid = OWNER) => `users/${uid}/rewardRedemptions/${id}`,
  task: (id: string, uid = OWNER) => `users/${uid}/tasks/${id}`,
};

/** Campos comunes de todo documento nuevo. */
export function created() {
  return { createdAt: serverTimestamp(), updatedAt: serverTimestamp(), schemaVersion: 1 };
}

export function profileDoc(overrides: DocumentData = {}): DocumentData {
  return {
    email: OWNER_EMAIL,
    displayName: 'Usuario',
    reminderSettings: {
      enabled: true,
      dailyReminderTime: '08:00',
      streakRiskReminderTime: '21:00',
    },
    ...created(),
    ...overrides,
  };
}

export function habitDoc(overrides: DocumentData = {}): DocumentData {
  return {
    name: 'Leer 20 minutos',
    description: null,
    icon: 'book',
    color: '#C4B2DE',
    category: 'mental',
    tier: 'primary',
    schedule: { type: 'daily' },
    status: 'active',
    sortOrder: 0,
    startDateKey: TODAY,
    archivedDateKey: null,
    ...created(),
    ...overrides,
  };
}

export const ANIME: Reward = {
  id: 'anime',
  name: 'Tarde de anime',
  tier: 'small',
  cost: 60,
  status: 'active',
};

export function rewardDoc(reward: Reward = ANIME, overrides: DocumentData = {}): DocumentData {
  return {
    name: reward.name,
    description: null,
    icon: 'tv',
    tier: reward.tier,
    cost: reward.cost,
    status: reward.status,
    sortOrder: 0,
    ...created(),
    ...overrides,
  };
}

/** Tarea pendiente para hoy, tal como la crea la app. */
export function taskDoc(overrides: DocumentData = {}): DocumentData {
  return {
    title: 'Pagar la luz',
    size: 'medium',
    dueDateKey: TODAY,
    completedDateKey: null,
    completedAt: null,
    ...created(),
    ...overrides,
  };
}

export function testTask(id: string, size: TaskSize, completedDateKey: string | null): Task {
  return {
    id,
    title: `Tarea ${id}`,
    size,
    dueDateKey: completedDateKey ?? TODAY,
    completedDateKey,
  };
}

export function openLogDoc(dateKey: string, entries: DailyEntries = {}): DocumentData {
  return { dateKey, entries, status: 'open', summary: null, ...created() };
}

export function gamificationDoc(state: GamificationState): DocumentData {
  return { ...state, ...created() };
}

/** Estado con al menos un día pendiente de cerrar (ayer). */
export function pendingState(overrides: Partial<GamificationState> = {}): GamificationState {
  return { ...initialGamificationState(YESTERDAY), ...overrides };
}

export function transactionDoc({ id: _id, ...fields }: PointTransaction): DocumentData {
  return { ...fields, ...created() };
}

export function testHabit(id: string, tier: HabitTier = 'primary'): Habit {
  return {
    id,
    name: `Hábito ${id}`,
    tier,
    schedule: { type: 'daily' },
    status: 'active',
    startDateKey: '2026-01-01',
    archivedDateKey: null,
  };
}

export function done(...habitIds: string[]): DailyEntries {
  return Object.fromEntries(habitIds.map((id) => [id, { completed: true }]));
}

// ---------- Escrituras en lote ----------

export interface Write {
  kind: 'set' | 'update';
  path: string;
  data: DocumentData;
}

export async function seedDocs(docs: Record<string, DocumentData>): Promise<void> {
  await seed(async (db) => {
    for (const [path, data] of Object.entries(docs)) {
      await setDoc(doc(db, path), data);
    }
  });
}

/** Un lote se valida igual que una transacción: `getAfter` ve todas sus escrituras. */
export function commit(db: Firestore, writes: readonly Write[]): Promise<void> {
  const batch = writeBatch(db);
  for (const write of writes) {
    if (write.kind === 'set') batch.set(doc(db, write.path), write.data);
    else batch.update(doc(db, write.path), write.data);
  }
  return batch.commit();
}

/** Cambia campos de una escritura del lote (para los casos denegados). */
export function tamper(writes: readonly Write[], path: string, patch: DocumentData): Write[] {
  if (!writes.some((write) => write.path === path)) throw new Error(`No hay escritura en ${path}`);
  return writes.map((write) =>
    write.path === path ? { ...write, data: { ...write.data, ...patch } } : write,
  );
}

export function without(writes: readonly Write[], path: string): Write[] {
  return writes.filter((write) => write.path !== path);
}

// ---------- Resumen mensual ----------

export function monthlyDoc(monthKey: MonthKey, counters: MonthlyCounters): DocumentData {
  return { monthKey, ...counters, ...created() };
}

function monthlyWrite(
  monthKey: MonthKey,
  before: MonthlyCounters | undefined,
  after: MonthlyCounters,
): Write {
  const path = paths.monthlySummary(monthKey);
  return before
    ? { kind: 'update', path, data: { ...after, updatedAt: serverTimestamp() } }
    : { kind: 'set', path, data: monthlyDoc(monthKey, after) };
}

// ---------- Operaciones ----------

export interface CloseInput {
  state: GamificationState;
  habits: readonly Habit[];
  entries?: DailyEntries;
  /** Tareas cumplidas en el día que se cierra. */
  completedTasks?: readonly Task[];
  /** El documento del día ya existe (hubo marcas); si no, el cierre lo crea. */
  logExists?: boolean;
  /** Resumen mensual existente; si no, el cierre lo crea. */
  monthly?: MonthlyCounters;
}

/** Las escrituras de `closePendingDays` para el día siguiente a `lastClosedDateKey`. */
export function planClose(input: CloseInput): { evaluation: DayEvaluation; writes: Write[] } {
  const { state, habits, entries = {}, completedTasks = [], logExists = true, monthly } = input;
  const dateKey = addDays(state.lastClosedDateKey, 1);
  const evaluation = evaluateDay({ dateKey, habits, entries, completedTasks, state });
  const summary = { ...evaluation.summary, closedAt: serverTimestamp() };
  const logPath = paths.dailyLog(dateKey);

  const writes: Write[] = [
    logExists
      ? {
          kind: 'update',
          path: logPath,
          data: { status: evaluation.status, summary, updatedAt: serverTimestamp() },
        }
      : {
          kind: 'set',
          path: logPath,
          data: { dateKey, entries: {}, status: evaluation.status, summary, ...created() },
        },
    ...evaluation.transactions.map((transaction): Write => ({
      kind: 'set',
      path: paths.transaction(transaction.id),
      data: transactionDoc(transaction),
    })),
    {
      kind: 'update',
      path: paths.gamification(),
      data: { ...evaluation.nextState, updatedAt: serverTimestamp() },
    },
    monthlyWrite(
      toMonthKey(dateKey),
      monthly,
      addClosedDay(monthly ?? EMPTY_MONTHLY_COUNTERS, evaluation),
    ),
  ];
  return { evaluation, writes };
}

/** Deja listo el estado previo a un cierre: gamificación, documento del día y resumen mensual. */
export async function seedBeforeClose(input: CloseInput): Promise<void> {
  const { state, entries = {}, logExists = true, monthly } = input;
  const dateKey = addDays(state.lastClosedDateKey, 1);
  await seedDocs({
    [paths.gamification()]: gamificationDoc(state),
    ...(logExists ? { [paths.dailyLog(dateKey)]: openLogDoc(dateKey, entries) } : {}),
    ...(monthly
      ? { [paths.monthlySummary(toMonthKey(dateKey))]: monthlyDoc(toMonthKey(dateKey), monthly) }
      : {}),
  });
}

function spendWrites(
  transaction: PointTransaction,
  nextState: GamificationState,
  monthly: MonthlyCounters | undefined,
): Write[] {
  return [
    { kind: 'set', path: paths.transaction(transaction.id), data: transactionDoc(transaction) },
    {
      kind: 'update',
      path: paths.gamification(),
      data: { ...nextState, updatedAt: serverTimestamp() },
    },
    monthlyWrite(
      toMonthKey(TODAY),
      monthly,
      addMonthlySpending(monthly ?? EMPTY_MONTHLY_COUNTERS, transaction.amount),
    ),
  ];
}

/** Las escrituras de `purchaseStreakFreeze`. */
export function planFreeze(
  state: GamificationState,
  requestId: string,
  monthly?: MonthlyCounters,
): Write[] {
  const plan = planFreezePurchase(state, requestId, TODAY);
  return spendWrites(plan.transaction, plan.nextState, monthly);
}

/** Las escrituras de `redeemReward`: el cobro y el canje con la foto de la recompensa. */
export function planRedeem(
  state: GamificationState,
  reward: Reward,
  requestId: string,
  monthly?: MonthlyCounters,
): Write[] {
  const plan = planRewardRedemption(state, reward, requestId, TODAY);
  return [
    ...spendWrites(plan.transaction, plan.nextState, monthly),
    {
      kind: 'set',
      path: paths.redemption(requestId),
      data: {
        rewardId: reward.id,
        rewardSnapshot: { name: reward.name, tier: reward.tier, cost: reward.cost },
        pointTransactionId: plan.transaction.id,
        dateKey: TODAY,
        redeemedAt: serverTimestamp(),
        note: null,
        ...created(),
      },
    },
  ];
}

/** Guarda el estado de gamificación antes de una compra o canje. */
export async function seedState(state: GamificationState): Promise<void> {
  await seedDocs({ [paths.gamification()]: gamificationDoc(state) });
}
