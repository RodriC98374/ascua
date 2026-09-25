// Datos de ejemplo en los emuladores locales (Auth y Firestore), para ver la app con historia:
// unos 80 días cerrados con la lógica real de `@ascua/shared` (rachas, protectores, bonos,
// tareas), compras de protectores y canjes. Solo habla con los emuladores de esta PC, nunca con el
// proyecto real, y borra lo que hubiera en ellos.
//
// Lo usan `npm run seed:demo` (solo siembra) y `npm run demo` (emuladores, siembra y web).
import { readFileSync } from 'node:fs';

import {
  addClosedDay,
  addDays,
  addMonthlySpending,
  canPurchaseFreeze,
  canRedeemReward,
  dateKeyRange,
  DEFAULT_REMINDER_SETTINGS,
  EMPTY_MONTHLY_COUNTERS,
  evaluateDay,
  initialGamificationState,
  initialUserProfile,
  MAX_STREAK_FREEZES,
  planFreezePurchase,
  planRewardRedemption,
  todayDateKey,
  toMonthKey,
  type DailyEntries,
  type DateKey,
  type GamificationState,
  type HabitRecord,
  type HabitTier,
  type MonthKey,
  type HabitCategory,
  type HabitColor,
  type MonthlyCounters,
  type PointTransaction,
  type RewardRecord,
  type RewardTier,
  type Task,
  type TaskSize,
} from '@ascua/shared';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, Timestamp, writeBatch, type DocumentData, type Firestore } from 'firebase/firestore';

import { SCHEMA_VERSION } from '../../../apps/client/src/data/documents';
import { DEFAULT_HABIT_ICON } from '../../../apps/client/src/operations/habits';
import { DEFAULT_REWARD_ICON } from '../../../apps/client/src/operations/rewards';

export const HOST = '127.0.0.1';
export const FIRESTORE_PORT = 8080;
export const AUTH_PORT = 9099;
const DEMO_EMAIL = 'demo@ascua.test';
const DEMO_PASSWORD = 'demo1234';
const DAYS_OF_HISTORY = 80;
/** Con `--streak`, días de historia antes de la racha pedida (si no alcanzan los 80). */
const DAYS_BEFORE_STREAK = 30;
/** Días flojos seguidos que apagan cualquier racha, aunque tenga todos los protectores. */
const STREAK_BREAK_DAYS = MAX_STREAK_FREEZES + 1;
/** Con `--risk`, la franja de racha en riesgo se ve desde la medianoche. */
const RISK_ALL_DAY_TIME = '00:00';
const BATCH_SIZE = 400;
const TASK_SIZES: readonly TaskSize[] = ['small', 'medium', 'large'];
const TASK_TITLES = [
  'Pagar la luz',
  'Llamar al banco',
  'Enviar el informe',
  'Comprar un regalo',
  'Renovar el carnet',
  'Ordenar el escritorio',
  'Responder correos',
  'Llevar el auto al taller',
  'Preparar la presentación',
  'Estudiar para el examen',
];

const ROOT = new URL('../../../', import.meta.url);

// ---------- Opciones ----------

export interface DemoOptions {
  /** Racha con la que se llega a hoy (días seguidos hasta ayer); null: la historia de siempre. */
  streak: number | null;
  /** Hora de racha en riesgo a las 00:00, para ver la franja de Hoy a cualquier hora. */
  isRiskAllDay: boolean;
}

export const DEMO_USAGE = [
  'Opciones:',
  '  --streak=<días>  llega a hoy con esa racha y con los principales de hoy sin marcar.',
  '                   La historia anterior nunca la supera: al marcarlos se celebra el',
  '                   hito que toque (--streak=6 → insignia de 7, --streak=29 → de 30).',
  '  --risk           hora de "racha en riesgo" a las 00:00: la franja de Hoy se ve siempre.',
].join('\n');

export function parseDemoOptions(args: readonly string[]): DemoOptions {
  const options: DemoOptions = { streak: null, isRiskAllDay: false };
  for (const arg of args) {
    const streak = /^--streak=(\d+)$/.exec(arg)?.[1];
    if (streak !== undefined) options.streak = Number(streak);
    else if (arg === '--risk') options.isRiskAllDay = true;
    else throw new Error(`Opción desconocida: ${arg}\n${DEMO_USAGE}`);
  }
  return options;
}

// ---------- Datos ----------

/** El proyecto por defecto de `.firebaserc`: el mismo que usan la app y los emuladores. */
export function projectId(): string {
  const firebaserc = JSON.parse(readFileSync(new URL('.firebaserc', ROOT), 'utf8')) as {
    projects: { default: string };
  };
  return firebaserc.projects.default;
}

/** El usuario de ejemplo debe tener el uid permitido en `firestore.rules`, o la app no leería nada. */
function allowedUid(): string {
  const rules = readFileSync(new URL('firestore.rules', ROOT), 'utf8');
  const match = /function allowedUids\(\) \{\s*return \[\s*'([^']+)'/.exec(rules);
  if (!match?.[1]) throw new Error('No encontré el uid permitido en firestore.rules.');
  return match[1];
}

/** Números pseudoaleatorios con semilla fija (mulberry32): cada siembra da los mismos datos. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function habit(
  id: string,
  name: string,
  tier: HabitTier,
  sortOrder: number,
  startDateKey: DateKey,
  category: HabitCategory,
  color: HabitColor,
  archivedDateKey: DateKey | null = null,
): HabitRecord {
  return {
    id,
    name,
    description: null,
    icon: DEFAULT_HABIT_ICON,
    color,
    category,
    tier,
    schedule: { type: 'daily' },
    status: archivedDateKey ? 'archived' : 'active',
    sortOrder,
    startDateKey,
    archivedDateKey,
  };
}

function reward(
  id: string,
  name: string,
  tier: RewardTier,
  cost: number,
  sortOrder: number,
): RewardRecord {
  return {
    id,
    name,
    description: null,
    icon: DEFAULT_REWARD_ICON,
    tier,
    cost,
    status: 'active',
    sortOrder,
  };
}

/** Un instante en hora de Bolivia (UTC-4). */
function at(dateKey: DateKey, time: string): Timestamp {
  return Timestamp.fromDate(new Date(`${dateKey}T${time}-04:00`));
}

function meta(createdAt: Timestamp) {
  return { createdAt, updatedAt: createdAt, schemaVersion: SCHEMA_VERSION };
}

function transactionDoc({ id: _id, ...fields }: PointTransaction, createdAt: Timestamp) {
  return { ...fields, ...meta(createdAt) };
}

/** Cómo le va a un día de la historia. */
interface DayPlan {
  /** Cumple sí o sí los principales; el resto, según su probabilidad. */
  isGoalForced: boolean;
  /** Día flojo: no cumple nada. */
  isRoughDay: boolean;
  /** A la mañana siguiente puede comprar un protector o canjear. */
  canSpend: boolean;
}

interface DemoData {
  documents: Map<string, DocumentData>;
  state: GamificationState;
}

function buildDemoData(uid: string, options: DemoOptions): DemoData {
  const today = todayDateKey();
  const { streak } = options;
  const historyDays =
    streak === null ? DAYS_OF_HISTORY : Math.max(DAYS_OF_HISTORY, streak + DAYS_BEFORE_STREAK);
  const start = addDays(today, -historyDays);
  const random = seededRandom(20260922);
  const user = `users/${uid}`;
  const documents = new Map<string, DocumentData>();

  const habits = [
    habit('leer', 'Leer 20 minutos', 'primary', 0, start, 'academic', '#A3C4D9'),
    habit('ejercicio', 'Ejercicio', 'primary', 1, start, 'physical', '#EFA98A'),
    habit('meditar', 'Meditar 10 minutos', 'primary', 2, addDays(start, 20), 'mental', '#C4B2DE'),
    habit('agua', 'Tomar 2 L de agua', 'secondary', 3, start, 'health', '#9FCBAC'),
    habit(
      'dormir',
      'Dormir antes de las 23:00',
      'secondary',
      4,
      addDays(start, 10),
      'health',
      '#96C7C0',
    ),
    habit(
      'ingles',
      'Inglés 15 minutos',
      'secondary',
      5,
      start,
      'academic',
      '#E3CB8E',
      addDays(start, 50),
    ),
  ];
  const chance: Record<string, number> = {
    leer: 0.97,
    ejercicio: 0.94,
    meditar: 0.93,
    agua: 0.85,
    dormir: 0.55,
    ingles: 0.6,
  };
  const rewards = [
    reward('series', 'Tarde de series', 'small', 60, 0),
    reward('delivery', 'Pedir comida que me gusta', 'medium', 180, 1),
    reward('cine', 'Cine con palomitas', 'large', 600, 2),
  ];

  const profile = initialUserProfile(DEMO_EMAIL);
  if (options.isRiskAllDay) {
    profile.reminderSettings = {
      ...DEFAULT_REMINDER_SETTINGS,
      streakRiskReminderTime: RISK_ALL_DAY_TIME,
    };
  }
  documents.set(user, { ...profile, ...meta(at(start, '08:00:00')) });
  for (const { id, ...fields } of habits) {
    documents.set(`${user}/habits/${id}`, {
      ...fields,
      ...meta(at(fields.startDateKey, '08:00:00')),
    });
  }
  for (const { id, ...fields } of rewards) {
    documents.set(`${user}/rewards/${id}`, { ...fields, ...meta(at(start, '08:00:00')) });
  }

  const monthly = new Map<MonthKey, MonthlyCounters>();
  const addToMonth = (monthKey: MonthKey, update: (counters: MonthlyCounters) => MonthlyCounters) =>
    monthly.set(monthKey, update(monthly.get(monthKey) ?? EMPTY_MONTHLY_COUNTERS));
  let state = initialGamificationState(start);
  let spends = 0;

  // Sin `--streak`: cada tanto un día flojo, para que haya días protegidos y perdidos, y las dos
  // últimas semanas cumple siempre los principales, para llegar a hoy con una racha encendida.
  // Con `--streak=N`: los últimos N días cumple los principales; antes, días flojos que apagan la
  // racha; y antes aún, la historia de siempre, sin que ninguna racha llegue a N.
  const planDay = (dateKey: DateKey): DayPlan => {
    if (streak === null) {
      const isRecent = dateKey >= addDays(today, -14);
      return { isGoalForced: isRecent, isRoughDay: !isRecent && random() < 0.08, canSpend: true };
    }
    if (dateKey >= addDays(today, -streak)) {
      return { isGoalForced: true, isRoughDay: false, canSpend: true };
    }
    if (dateKey >= addDays(today, -streak - STREAK_BREAK_DAYS)) {
      return { isGoalForced: false, isRoughDay: true, canSpend: false };
    }
    const isAtCap = streak > 0 && state.currentStreak >= Math.max(streak - 1, 1);
    return { isGoalForced: false, isRoughDay: isAtCap || random() < 0.08, canSpend: true };
  };

  // Las tareas usan su propio azar: así la historia de los hábitos es la misma que antes de ellas.
  const taskRandom = seededRandom(20260925);
  let taskCount = 0;
  const addTask = (
    dueDateKey: DateKey,
    completedDateKey: DateKey | null,
    size: TaskSize = TASK_SIZES[Math.floor(taskRandom() * TASK_SIZES.length)] ?? 'medium',
  ): Task => {
    const task: Task = {
      id: `demo-task-${taskCount}`,
      title: TASK_TITLES[taskCount % TASK_TITLES.length] ?? 'Tarea',
      size,
      dueDateKey,
      completedDateKey,
    };
    taskCount++;
    const { id, ...fields } = task;
    const createdAt = at(addDays(dueDateKey, -1), '10:00:00');
    documents.set(`${user}/tasks/${id}`, {
      ...fields,
      completedAt: completedDateKey ? at(completedDateKey, '18:00:00') : null,
      ...meta(createdAt),
    });
    return task;
  };

  for (const dateKey of dateKeyRange(start, addDays(today, -1))) {
    const { isGoalForced, isRoughDay, canSpend } = planDay(dateKey);
    const entries: Record<string, { completed: boolean }> = {};
    for (const { id, tier } of habits) {
      const isDone = (isGoalForced && tier === 'primary') || random() < (chance[id] ?? 0.5);
      if (!isRoughDay && isDone) entries[id] = { completed: true };
    }
    // Uno de cada dos días cumple una o dos tareas; a veces, una que venía vencida.
    const completedTasks: Task[] = [];
    if (taskRandom() < 0.5) {
      const count = taskRandom() < 0.6 ? 1 : 2;
      for (let index = 0; index < count; index++) {
        const dueDateKey = taskRandom() < 0.2 ? addDays(dateKey, -2) : dateKey;
        completedTasks.push(addTask(dueDateKey, dateKey));
      }
    }
    const evaluation = evaluateDay({
      dateKey,
      habits,
      entries: entries as DailyEntries,
      completedTasks,
      state,
    });
    const closedAt = at(addDays(dateKey, 1), '07:30:00');
    const markedAt = at(dateKey, '20:00:00');

    documents.set(`${user}/dailyLogs/${dateKey}`, {
      dateKey,
      entries: Object.fromEntries(
        Object.entries(entries).map(([id, entry]) => [id, { ...entry, updatedAt: markedAt }]),
      ),
      status: evaluation.status,
      summary: { ...evaluation.summary, closedAt },
      ...meta(markedAt),
    });
    evaluation.transactions.forEach((transaction, index) => {
      const createdAt = Timestamp.fromMillis(closedAt.toMillis() + index);
      documents.set(
        `${user}/pointTransactions/${transaction.id}`,
        transactionDoc(transaction, createdAt),
      );
    });
    addToMonth(toMonthKey(dateKey), (counters) => addClosedDay(counters, evaluation));
    state = evaluation.nextState;
    if (!canSpend) continue;

    // A la mañana siguiente, a veces compra un protector o canjea una recompensa.
    const spendDay = addDays(dateKey, 1);
    const spendAt = at(spendDay, '09:00:00');
    if (state.streakFreezesAvailable === 0 && canPurchaseFreeze(state).ok && random() < 0.15) {
      const requestId = `demo-freeze-${spends++}`;
      const plan = planFreezePurchase(state, requestId, spendDay);
      documents.set(
        `${user}/pointTransactions/${plan.transaction.id}`,
        transactionDoc(plan.transaction, spendAt),
      );
      addToMonth(toMonthKey(spendDay), (counters) =>
        addMonthlySpending(counters, plan.transaction.amount),
      );
      state = plan.nextState;
    } else {
      const choice = rewards[Math.floor(random() * rewards.length)];
      if (choice && canRedeemReward(state, choice).ok && random() < 0.12) {
        const requestId = `demo-redeem-${spends++}`;
        const plan = planRewardRedemption(state, choice, requestId, spendDay);
        documents.set(
          `${user}/pointTransactions/${plan.transaction.id}`,
          transactionDoc(plan.transaction, spendAt),
        );
        documents.set(`${user}/rewardRedemptions/${requestId}`, {
          rewardId: choice.id,
          rewardSnapshot: { name: choice.name, tier: choice.tier, cost: choice.cost },
          pointTransactionId: plan.transaction.id,
          dateKey: spendDay,
          redeemedAt: spendAt,
          note: random() < 0.5 ? '¡Me lo gané!' : null,
          ...meta(spendAt),
        });
        addToMonth(toMonthKey(spendDay), (counters) =>
          addMonthlySpending(counters, plan.transaction.amount),
        );
        state = plan.nextState;
      }
    }
  }

  // La racha de hoy debe ser la pedida y, si hay racha, también la mejor (la del hito por ganar).
  if (
    streak !== null &&
    (state.currentStreak !== streak || (streak > 0 && state.longestStreak !== streak))
  ) {
    throw new Error(
      `La historia quedó con racha ${state.currentStreak} y mejor racha ${state.longestStreak}; se pidió ${streak}.`,
    );
  }

  for (const [monthKey, counters] of monthly) {
    documents.set(`${user}/monthlySummaries/${monthKey}`, {
      monthKey,
      ...counters,
      ...meta(at(`${monthKey}-01`, '07:30:00')),
    });
  }
  // Hoy, abierto y a medias: un principal y un secundario hechos, dos principales pendientes.
  const nowAt = at(today, '08:00:00');
  documents.set(`${user}/dailyLogs/${today}`, {
    dateKey: today,
    entries: {
      leer: { completed: true, updatedAt: nowAt },
      agua: { completed: true, updatedAt: nowAt },
    },
    status: 'open',
    summary: null,
    ...meta(nowAt),
  });
  documents.set(`${user}/meta/gamification`, { ...state, ...meta(nowAt) });

  // Tareas de hoy: una vencida, dos para hoy (una ya cumplida) y dos para los próximos días.
  addTask(addDays(today, -2), null, 'medium');
  addTask(today, null, 'small');
  addTask(today, today, 'medium');
  addTask(addDays(today, 1), null, 'large');
  addTask(addDays(today, 4), null, 'small');

  return { documents, state };
}

// ---------- Emuladores ----------

async function emulatorRequest(port: number, path: string, init: RequestInit = {}) {
  const url = `http://${HOST}:${port}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`${init.method ?? 'GET'} ${url}: ${response.status} ${await response.text()}`);
  }
}

async function resetEmulators(project: string) {
  await emulatorRequest(
    FIRESTORE_PORT,
    `/emulator/v1/projects/${project}/databases/(default)/documents`,
    { method: 'DELETE' },
  );
  await emulatorRequest(AUTH_PORT, `/emulator/v1/projects/${project}/accounts`, {
    method: 'DELETE',
  });
}

async function createDemoUser(project: string, uid: string) {
  await emulatorRequest(
    AUTH_PORT,
    `/identitytoolkit.googleapis.com/v1/projects/${project}/accounts`,
    {
      method: 'POST',
      body: JSON.stringify({ localId: uid, email: DEMO_EMAIL, password: DEMO_PASSWORD }),
    },
  );
}

async function writeDocuments(project: string, documents: Map<string, DocumentData>) {
  const env = await initializeTestEnvironment({
    projectId: project,
    firestore: { host: HOST, port: FIRESTORE_PORT },
  });
  try {
    await env.withSecurityRulesDisabled(async (context) => {
      // El contexto devuelve la API compat; las funciones modulares la aceptan.
      const db = context.firestore() as unknown as Firestore;
      const entries = [...documents];
      for (let index = 0; index < entries.length; index += BATCH_SIZE) {
        const batch = writeBatch(db);
        for (const [path, data] of entries.slice(index, index + BATCH_SIZE)) {
          batch.set(doc(db, path), data);
        }
        await batch.commit();
      }
    });
  } finally {
    await env.cleanup();
  }
}

/** Vacía los emuladores y siembra la cuenta de ejemplo. Deben estar encendidos. */
export async function seedDemo(options: DemoOptions): Promise<void> {
  const project = projectId();
  const uid = allowedUid();
  try {
    await resetEmulators(project);
  } catch (error) {
    console.error('No pude hablar con los emuladores. ¿Están corriendo (`npm run emulators`)?');
    throw error;
  }
  await createDemoUser(project, uid);
  const { documents, state } = buildDemoData(uid, options);
  await writeDocuments(project, documents);

  console.log(`Listo: ${documents.size} documentos en los emuladores de ${project}.`);
  console.log(
    `Saldo: ${state.pointsBalance} pts. Racha: ${state.currentStreak} (mejor: ${state.longestStreak}). Protectores: ${state.streakFreezesAvailable}.`,
  );
  if (options.isRiskAllDay) {
    console.log('Racha en riesgo desde las 00:00: la franja de Hoy se ve a cualquier hora.');
  }
  console.log(`Entra con ${DEMO_EMAIL} / ${DEMO_PASSWORD} (la app debe usar los emuladores).`);
}
